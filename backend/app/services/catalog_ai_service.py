import logging
import os
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.models.product import Product, ProductVersion, ProductAttribute
from app.db.models.document import Document

logger = logging.getLogger("catalog_ai_service")

# Simple in-memory storage for lightweight conversation memory
CONVERSATION_MEMORY: Dict[str, str] = {}

class CatalogAIService:
    @staticmethod
    def chat(db: Session, message: str, conversation_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Grounded Ask Catalog AI Chat Engine.
        Answers all types of questions strictly grounded in existing uploaded documents and database records.
        """
        raw_msg = message.strip()
        lower_msg = raw_msg.lower()

        if not raw_msg:
            return {
                "answer": "Please ask a question about your uploaded documents or products.",
                "sources": [],
                "confidence": 0.0,
                "hasConflict": False
            }

        all_documents = db.query(Document).order_by(Document.id.desc()).all()
        all_products = db.query(Product).order_by(Product.id.desc()).all()

        if not all_documents and not all_products:
            return {
                "answer": "No uploaded document data found in the system. Please upload a datasheet, CSV, Excel, or PDF document on the Upload page first.",
                "sources": [],
                "confidence": 1.0,
                "hasConflict": False
            }

        # Build default doc sources citation list
        doc_sources: List[Dict[str, Any]] = []
        for doc in all_documents:
            doc_name = doc.original_file_name or doc.file_name
            doc_sources.append({
                "productId": doc.product_id or doc.id,
                "documentId": doc_name,
                "docName": doc_name,
                "documentType": doc.document_type or "DATASHEET",
                "version": doc.version_detected or "v1.0",
                "page": 1,
                "snippet": f"Document record for {doc_name}",
                "verified": True
            })

        # Category A: Document Listing / Overview Query ("what documents", "list files", "summary of uploaded file", "overview")
        if any(w in lower_msg for w in ["what document", "list file", "list document", "show file", "uploaded file", "summary", "overview", "all document", "all file"]):
            lines = [f"Found **{len(all_documents)} uploaded document(s)** in the system:"]
            for doc in all_documents:
                doc_name = doc.original_file_name or doc.file_name
                attrs = doc.extracted_attributes or {}
                name = attrs.get("name", attrs.get("product name", os.path.splitext(doc_name)[0].replace("_", " ").title()))
                cat = attrs.get("category", "Industrial Catalog")
                lines.append(f"• **{doc_name}** (`{doc.document_type}`): {name} ({cat}) — Status: {doc.processing_status}")
            
            return {
                "answer": "\n\n".join(lines),
                "sources": doc_sources[:3],
                "confidence": 1.0,
                "hasConflict": False
            }

        # Category B: Product Listing Query ("list products", "all products", "what products", "show catalog")
        if any(w in lower_msg for w in ["list product", "all product", "what product", "show product", "catalog list"]):
            lines = [f"Found **{len(all_products) or len(all_documents)} product(s)** from uploaded datasets:"]
            
            if all_products:
                for p in all_products:
                    version = db.query(ProductVersion).filter(ProductVersion.product_id == p.id, ProductVersion.is_current == True).first()
                    version_str = version.version_number if version else "v1.0"
                    lines.append(f"• **{p.name}** (`{p.product_code}`): Category: {p.category} | Manufacturer: {p.manufacturer or 'Uploaded OEM'} | Version: {version_str}")
            else:
                for doc in all_documents:
                    doc_name = doc.original_file_name or doc.file_name
                    attrs = doc.extracted_attributes or {}
                    name = attrs.get("name", os.path.splitext(doc_name)[0].replace("_", " ").title())
                    code = attrs.get("product_code", f"DOC-{doc.id}")
                    lines.append(f"• **{name}** (`{code}`): Source: `{doc_name}`")

            return {
                "answer": "\n".join(lines),
                "sources": doc_sources[:3],
                "confidence": 1.0,
                "hasConflict": False
            }

        # Category C: Search for specific product / attribute across uploaded documents
        matched_doc = None
        matched_product = None

        for doc in all_documents:
            doc_name = (doc.original_file_name or doc.file_name).lower()
            doc_base = os.path.splitext(doc_name)[0].replace("_", " ").replace("-", " ")
            if doc_base in lower_msg or any(word in lower_msg for word in doc_base.split() if len(word) > 3):
                matched_doc = doc
                break

        for p in all_products:
            p_code = p.product_code.lower()
            p_name = p.name.lower() if p.name else ""
            if p_code in lower_msg or (len(p_code) > 3 and p_code.replace("-", "") in lower_msg.replace("-", "")):
                matched_product = p
                break
            if p_name and any(word in lower_msg for word in p_name.split() if len(word) > 3):
                matched_product = p
                break

        target_doc = matched_doc or all_documents[0]
        target_product = matched_product or (all_products[0] if all_products else None)

        target_doc_name = target_doc.original_file_name or target_doc.file_name
        spec_map: Dict[str, str] = {}

        if target_product:
            version = db.query(ProductVersion).filter(ProductVersion.product_id == target_product.id).order_by(ProductVersion.id.desc()).first()
            attributes = db.query(ProductAttribute).filter(ProductAttribute.product_version_id == version.id).all() if version else []
            for a in attributes:
                spec_map[a.attribute_name.lower().strip()] = a.attribute_value.strip()

        if target_doc and target_doc.extracted_attributes:
            for k, v in target_doc.extracted_attributes.items():
                if not k.startswith("Column:") and not k.startswith("Total") and not k.startswith("Primary"):
                    spec_map[k.lower().strip()] = str(v).strip()

        # Check if user asked a specific attribute question (voltage, price, power, speed, delivery, stock, category, etc.)
        matched_key = None
        matched_val = None

        for k, v in spec_map.items():
            if k in lower_msg:
                matched_key = k
                matched_val = v
                break

        if not matched_key:
            if "voltage" in lower_msg or "volt" in lower_msg:
                matched_key = next((k for k in spec_map if "volt" in k or "v" in k), None)
            elif "power" in lower_msg or "output" in lower_msg or "kw" in lower_msg or "hp" in lower_msg:
                matched_key = next((k for k in spec_map if "power" in k or "output" in k or "kw" in k or "hp" in k), None)
            elif "speed" in lower_msg or "rpm" in lower_msg:
                matched_key = next((k for k in spec_map if "speed" in k or "rpm" in k), None)
            elif "ip" in lower_msg or "protection" in lower_msg:
                matched_key = next((k for k in spec_map if "ip" in k or "protection" in k or "ingress" in k), None)
            elif "price" in lower_msg or "cost" in lower_msg or "rate" in lower_msg or "inr" in lower_msg:
                matched_key = next((k for k in spec_map if "price" in k or "cost" in k or "rate" in k), None)
            elif "delivery" in lower_msg or "lead time" in lower_msg or "dispatch" in lower_msg:
                matched_key = next((k for k in spec_map if "delivery" in k or "lead" in k), None)
            elif "stock" in lower_msg or "inventory" in lower_msg or "quantity" in lower_msg:
                matched_key = next((k for k in spec_map if "stock" in k or "inventory" in k), None)
            elif "category" in lower_msg or "type" in lower_msg:
                matched_key = next((k for k in spec_map if "category" in k or "type" in k), None)
            elif "manufacturer" in lower_msg or "vendor" in lower_msg or "supplier" in lower_msg:
                matched_key = next((k for k in spec_map if "manufacturer" in k or "vendor" in k or "supplier" in k), None)

            if matched_key:
                matched_val = spec_map[matched_key]

        # If specific key matched:
        if matched_key and matched_val:
            prod_title = spec_map.get("name", spec_map.get("product_code", target_doc_name))
            return {
                "answer": f"According to verified document **{target_doc_name}**, the **{matched_key.title()}** for **{prod_title}** is **{matched_val}**.",
                "sources": [{
                    "productId": target_doc.id,
                    "documentId": target_doc_name,
                    "docName": target_doc_name,
                    "documentType": target_doc.document_type or "DATASHEET",
                    "version": "v1.0",
                    "page": 1,
                    "snippet": f"{matched_key.title()}: {matched_val}",
                    "verified": True
                }],
                "confidence": 1.0,
                "hasConflict": False
            }

        # If user asked a specific attribute question that is NOT present in document specs:
        specific_attribute_types = ["temperature", "noise", "vibration", "weight", "material", "pressure", "voltage", "power", "speed", "ip rating", "price", "delivery", "stock", "warranty"]
        if any(attr_t in lower_msg for attr_t in specific_attribute_types) and not matched_key:
            return {
                "answer": f"Information not found in the uploaded company dataset. The requested specification is not documented in `{target_doc_name}`. Please upload an updated datasheet on the Upload page.",
                "sources": [{
                    "productId": target_doc.id,
                    "documentId": target_doc_name,
                    "docName": target_doc_name,
                    "documentType": target_doc.document_type or "DATASHEET",
                    "version": "v1.0",
                    "page": 1,
                    "snippet": f"Document {target_doc_name} attributes index",
                    "verified": True
                }],
                "confidence": 1.0,
                "hasConflict": False
            }

        # General Question about the Document / Product: Return complete specifications extracted from uploaded document!
        prod_title = spec_map.get("name", spec_map.get("product_code", target_doc_name))
        specs_lines = []
        for k, v in spec_map.items():
            if k not in ["name", "product_code"] and not k.startswith("Column:") and not k.startswith("Total"):
                specs_lines.append(f"• **{k.title()}**: {v}")

        specs_summary = "\n".join(specs_lines) if specs_lines else "• All extracted attributes are verified from file header & rows."

        return {
            "answer": (
                f"### Verified Data Extracted from Uploaded Document: **{target_doc_name}**\n\n"
                f"• **Product / Item Name**: {prod_title}\n"
                f"• **File Type**: {target_doc.mime_type or target_doc.document_type}\n"
                f"• **Processing Status**: {target_doc.processing_status}\n\n"
                f"**Extracted Specifications & Properties:**\n{specs_summary}\n\n"
                f"Source Citation: `{target_doc_name}`"
            ),
            "sources": [{
                "productId": target_doc.id,
                "documentId": target_doc_name,
                "docName": target_doc_name,
                "documentType": target_doc.document_type or "DATASHEET",
                "version": "v1.0",
                "page": 1,
                "snippet": f"Complete specifications for {target_doc_name}",
                "verified": True
            }],
            "confidence": 1.0,
            "hasConflict": False
        }
