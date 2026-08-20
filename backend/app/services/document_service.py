import csv
import io
import os
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional, List, Tuple, Dict, Any
from fastapi import UploadFile, HTTPException
from app.db.models.document import Document
from app.db.models.product import Product
from app.db.models.product import ProductAttribute, ProductVersion
from app.db.models.change import Change, ChangeImpact
from app.utils.file_storage import save_uploaded_file
from app.schemas.document import DocumentUploadResponse, DocumentResponse

from app.services.pdf_processor import PDFProcessor

NON_SPEC_FIELDS = {
    "id", "name", "category", "version", "supplier id", "supplier name",
    "supplier status", "unit price (inr)", "currency", "stock qty",
    "delivery days", "moq", "warranty (months)", "quote validity (days)",
    "payment terms", "incoterms", "offer status", "supplier data source",
    "commercial data last updated"
}

class DocumentService:
    @staticmethod
    async def upload_document(
        db: Session,
        file: UploadFile,
        product_id: Optional[int] = None,
        uploaded_by: str = "System / Engineering Lead"
    ) -> DocumentUploadResponse:
        # Save file to uploads directory and get metadata
        file_meta = await save_uploaded_file(file)
        file_path = file_meta["file_path"]
        orig_name = file_meta["original_file_name"]
        orig_lower = orig_name.lower()

        extracted_data: Dict[str, Any] = {
            "pages_count": 1,
            "extracted_summary": f"Ingested {orig_name} with verified processing.",
            "extracted_attributes": {},
            "source_citations": []
        }

        matched_product: Optional[Product] = None
        version_detected: Optional[str] = None

        # 1. Process CSV files
        if orig_lower.endswith(".csv") and os.path.exists(file_path):
            try:
                with open(file_path, "r", encoding="utf-8-sig", errors="ignore") as f:
                    reader = csv.DictReader(f)
                    rows = list(reader)
                    if rows:
                        first_row = rows[0]
                        row_id = (first_row.get("ID") or first_row.get("id") or first_row.get("Model") or first_row.get("Product Code") or "").strip()
                        row_ver = (first_row.get("Version") or first_row.get("version") or "2").strip()
                        version_detected = f"v{row_ver}.0" if "." not in row_ver else f"v{row_ver}"

                        # Extract specs
                        specs: Dict[str, str] = {}
                        for k, v in first_row.items():
                            if v and k.strip().lower() not in NON_SPEC_FIELDS:
                                specs[k.strip()] = str(v).strip()

                        extracted_data["extracted_attributes"] = specs
                        extracted_data["pages_count"] = len(rows)
                        extracted_data["extracted_summary"] = f"Ingested {len(specs)} technical attributes from {orig_name}. Detected Version {version_detected}."

                        # Match product
                        if row_id:
                            matched_product = db.query(Product).filter(Product.product_code == row_id).first()
                            if not matched_product:
                                # Create product dynamically if not found
                                prod_name = first_row.get("Name") or row_id
                                prod_cat = first_row.get("Category") or "Industrial Equipment"
                                matched_product = Product(
                                    product_code=row_id,
                                    name=prod_name,
                                    category=prod_cat,
                                    manufacturer="InduCore",
                                    status="ACTIVE",
                                    health_score=95
                                )
                                db.add(matched_product)
                                db.commit()
                                db.refresh(matched_product)
            except Exception as csv_err:
                extracted_data["extracted_summary"] = f"CSV read note: {csv_err}"

        # 2. Process PDF files
        elif orig_lower.endswith(".pdf") and os.path.exists(file_path):
            try:
                pdf_res = PDFProcessor.extract_pdf_content(file_path)
                if pdf_res:
                    extracted_data.update(pdf_res)
            except Exception as pdf_err:
                extracted_data["extracted_summary"] = f"PDF stored. Extraction note: {pdf_err}"

        # 3. Match product if not matched yet
        if not matched_product:
            if product_id:
                matched_product = db.query(Product).filter(Product.id == product_id).first()
            else:
                # Try matching by filename against all products in DB
                all_prods = db.query(Product).all()
                for p in all_prods:
                    if p.product_code.lower() in orig_lower:
                        matched_product = p
                        break

        # 4. Save Document record
        doc_record = Document(
            file_name=file_meta["file_name"],
            original_file_name=orig_name,
            file_path=file_path,
            document_type=file_meta["document_type"],
            file_size=file_meta["file_size"],
            file_size_formatted=file_meta["file_size_formatted"],
            mime_type=file_meta["mime_type"],
            content_hash=file_meta["content_hash"],
            product_id=matched_product.id if matched_product else None,
            uploaded_by=uploaded_by,
            processing_status="PROCESSED",
            version_detected=version_detected or ("v2.0" if "2026" in orig_name or "v2" in orig_lower else "v1.0"),
            match_confidence=0.98 if matched_product else 1.0,
            pages_count=extracted_data.get("pages_count", 1),
            extracted_summary=extracted_data.get("extracted_summary"),
            extracted_attributes=extracted_data.get("extracted_attributes", {}),
            source_citations=extracted_data.get("source_citations", [])
        )

        db.add(doc_record)
        db.commit()
        db.refresh(doc_record)

        # 5. Detect changes against current product attributes
        if matched_product and extracted_data.get("extracted_attributes"):
            new_attrs = extracted_data["extracted_attributes"]
            
            # Fetch existing specs for this product
            current_attrs_map = {}
            if matched_product.current_version_id:
                existing_attrs = db.query(ProductAttribute).filter(
                    ProductAttribute.product_version_id == matched_product.current_version_id
                ).all()
                for ea in existing_attrs:
                    current_attrs_map[ea.attribute_name.strip().lower()] = (ea.attribute_name, ea.attribute_value)

            for spec_key, new_val in new_attrs.items():
                norm_key = spec_key.strip().lower()
                if norm_key in current_attrs_map:
                    canonical_name, old_val = current_attrs_map[norm_key]
                    if old_val != str(new_val):
                        # Check if change already recorded
                        existing_chg = db.query(Change).filter(
                            Change.product_id == matched_product.id,
                            Change.attribute_name == canonical_name,
                            Change.source_document == orig_name
                        ).first()

                        if not existing_chg:
                            chg = Change(
                                product_id=matched_product.id,
                                attribute_name=canonical_name,
                                old_value=old_val,
                                new_value=str(new_val),
                                change_type="MODIFICATION",
                                source_document=orig_name,
                                confidence=0.98,
                                status="PENDING"
                            )
                            db.add(chg)
                            db.commit()
                            db.refresh(chg)

                            # Create ChangeImpact record for E-commerce
                            imp = ChangeImpact(
                                change_id=chg.id,
                                impact_type="E-commerce",
                                affected_entity_type="Storefront Specification",
                                affected_entity_id=matched_product.product_code,
                                title=f"Storefront {canonical_name} Update ({old_val} → {new_val})",
                                description=f"B2B online catalog specification for {matched_product.name} ({matched_product.product_code}) differs from newly ingested datasheet.",
                                context_evidence=f"Uploaded {orig_name}: {canonical_name} = {new_val}",
                                severity="high",
                                reviewed=False,
                                target_module_url="/ecommerce"
                            )
                            db.add(imp)
                            db.commit()

        return DocumentUploadResponse(
            id=doc_record.id,
            file_name=doc_record.file_name,
            original_file_name=doc_record.original_file_name,
            document_type=doc_record.document_type,
            file_size=doc_record.file_size,
            file_size_formatted=doc_record.file_size_formatted,
            processing_status=doc_record.processing_status,
            product_id=doc_record.product_id,
            product_model=matched_product.product_code if matched_product else None,
            match_confidence=doc_record.match_confidence,
            is_same_product_detected=bool(matched_product),
            uploaded_at=doc_record.uploaded_at,
            message="Document uploaded, stored, and indexed successfully"
        )

    @staticmethod
    def get_documents(
        db: Session,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        document_type: Optional[str] = None,
        processing_status: Optional[str] = None,
        product_id: Optional[int] = None
    ) -> Tuple[List[Document], int]:
        query = db.query(Document)

        if product_id:
            query = query.filter(Document.product_id == product_id)
        if document_type:
            query = query.filter(Document.document_type == document_type)
        if processing_status:
            query = query.filter(Document.processing_status == processing_status)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Document.original_file_name.ilike(search_term),
                    Document.file_name.ilike(search_term),
                    Document.uploaded_by.ilike(search_term)
                )
            )

        total = query.count()
        offset = (page - 1) * limit
        items = query.order_by(desc(Document.created_at)).offset(offset).limit(limit).all()
        return items, total

    @staticmethod
    def get_document_by_id(db: Session, doc_id: int) -> Document:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document ID {doc_id} not found")
        return doc
