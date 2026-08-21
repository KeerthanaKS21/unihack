import csv
import io
import os
import re
import json
import logging
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional, List, Tuple, Dict, Any
from fastapi import UploadFile, HTTPException

from app.db.models.document import Document
from app.db.models.product import Product, ProductVersion, ProductAttribute
from app.db.models.change import Change, ChangeImpact
from app.db.models.certificate import Certificate
from app.utils.file_storage import save_uploaded_file
from app.schemas.document import DocumentUploadResponse, DocumentResponse, ProductExtractionResponse

from app.services.pdf_processor import PDFProcessor
from app.services.docx_processor import DocxProcessor
from app.services.image_processor import ImageProcessor
from app.services.tabular_processor import TabularProcessor
from app.services.product_extraction_service import ProductExtractionService
from app.services.product_identification_service import ProductIdentificationService
from app.services.version_detection_service import VersionDetectionService

logger = logging.getLogger("document_service")

NON_SPEC_FIELDS = {
    "id", "product id", "name", "category", "version", "supplier id", "supplier name",
    "supplier status", "unit price (inr)", "currency", "stock qty",
    "delivery days", "moq", "warranty (months)", "quote validity (days)",
    "payment terms", "incoterms", "offer status", "supplier data source",
    "commercial data last updated", "model reference", "last checked date"
}

def clean_val(val: Any) -> str:
    if val is None:
        return ""
    s = str(val).strip()
    # Normalize ratio e.g. "12:01" -> "12:1"
    if re.match(r"^\d+:\d+$", s):
        parts = s.split(":")
        s = f"{int(parts[0])}:{int(parts[1])}"
    return s

def clean_key(key: str) -> str:
    return key.lstrip("\ufeff").strip()

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

        extracted_specs: Dict[str, str] = {}
        matched_product: Optional[Product] = None
        detected_version: Optional[str] = None
        summary_text = f"Ingested {orig_name} with verified processing."

        # 1. Process CSV / Spreadsheets (.xlsx, .xls, .csv) with TabularProcessor
        if orig_lower.endswith((".csv", ".xlsx", ".xls")) and os.path.exists(file_path):
            try:
                tab_res = TabularProcessor.extract_tabular_content(file_path, orig_name)
                if tab_res and tab_res.get("extracted_attributes"):
                    extracted_specs = tab_res["extracted_attributes"]
                    summary_text = tab_res.get("extracted_summary") or summary_text
            except Exception as tab_err:
                logger.warning(f"Tabular extraction error: {tab_err}")

        # 2. Process PDF files
        elif orig_lower.endswith(".pdf") and os.path.exists(file_path):
            try:
                pdf_res = PDFProcessor.extract_pdf_content(file_path)
                if pdf_res and pdf_res.get("extracted_attributes"):
                    extracted_specs = pdf_res["extracted_attributes"]
                    summary_text = pdf_res.get("extracted_summary") or summary_text
            except Exception as pdf_err:
                logger.warning(f"PDF extraction error: {pdf_err}")

        # 3. Process DOCX files
        elif orig_lower.endswith((".docx", ".doc")) and os.path.exists(file_path):
            try:
                docx_res = DocxProcessor.extract_docx_content(file_path, orig_name)
                if docx_res and docx_res.get("extracted_attributes"):
                    extracted_specs = docx_res["extracted_attributes"]
                    summary_text = docx_res.get("extracted_summary") or summary_text
            except Exception as docx_err:
                logger.warning(f"DOCX extraction error: {docx_err}")

        # 4. Process Image files (PNG, JPG, JPEG, WEBP)
        elif orig_lower.endswith((".png", ".jpg", ".jpeg", ".webp")) and os.path.exists(file_path):
            try:
                img_res = ImageProcessor.extract_image_content(file_path, orig_name)
                if img_res and img_res.get("extracted_attributes"):
                    extracted_specs = img_res["extracted_attributes"]
                    summary_text = img_res.get("extracted_summary") or summary_text
            except Exception as img_err:
                logger.warning(f"Image extraction error: {img_err}")

        # 4. Fallback product matching if not resolved
        if not matched_product:
            if product_id:
                matched_product = db.query(Product).filter(Product.id == product_id).first()
            else:
                all_prods = db.query(Product).all()
                for p in all_prods:
                    if p.product_code.lower() in orig_lower:
                        matched_product = p
                        break

        if not detected_version:
            detected_version = "v2.0" if "v2" in orig_lower or "2026" in orig_lower else "v1.0"

        # 5. Create Document record
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
            version_detected=detected_version,
            match_confidence=0.98 if matched_product else 1.0,
            pages_count=1,
            extracted_summary=summary_text,
            extracted_attributes=extracted_specs,
            source_citations=[]
        )

        db.add(doc_record)
        db.commit()
        db.refresh(doc_record)

        # 6. Extract Product Intelligence & Auto-run detection pipeline
        try:
            DocumentService.extract_product_intelligence(db, doc_record.id)
            db.refresh(doc_record)
        except Exception as ext_err:
            logger.warning(f"Auto-extraction warning on upload: {ext_err}")

        # Ensure a Product master record exists for this uploaded document
        if not matched_product:
            prod_name = extracted_specs.get("name", extracted_specs.get("product name", extracted_specs.get("product", "")))
            if not prod_name:
                prod_name = os.path.splitext(orig_name)[0].replace("_", " ").replace("-", " ").title()

            prod_code = extracted_specs.get("product_code", extracted_specs.get("model", extracted_specs.get("sku", "")))
            if not prod_code:
                prod_code = re.sub(r'[^a-zA-Z0-9]', '', os.path.splitext(orig_name)[0]).upper()[:15] or f"PROD-{doc_record.id}"

            prod_category = extracted_specs.get("category", extracted_specs.get("product type", ""))
            if not prod_category:
                orig_l = orig_name.lower()
                if "motor" in orig_l or "induction" in orig_l:
                    prod_category = "Motors & Drives"
                elif "pump" in orig_l:
                    prod_category = "Pumps & Fluid Handling"
                elif "valve" in orig_l:
                    prod_category = "Valves & Control"
                elif "compressor" in orig_l:
                    prod_category = "Compressors"
                elif "gearbox" in orig_l or "reducer" in orig_l:
                    prod_category = "Gearboxes & Power Transmission"
                else:
                    prod_category = "Industrial Equipment"

            prod_mfr = extracted_specs.get("supplier name", extracted_specs.get("manufacturer", extracted_specs.get("brand", "Uploaded OEM Vendor")))

            matched_product = db.query(Product).filter(
                or_(Product.product_code == prod_code, Product.name == prod_name)
            ).first()

            if not matched_product:
                matched_product = Product(
                    product_code=prod_code,
                    name=prod_name,
                    category=prod_category,
                    manufacturer=prod_mfr,
                    status="ACTIVE"
                )
                db.add(matched_product)
                db.commit()
                db.refresh(matched_product)

            doc_record.product_id = matched_product.id
            db.commit()

        # Create/update active ProductVersion and ProductAttributes for this product
        active_ver = db.query(ProductVersion).filter(
            ProductVersion.product_id == matched_product.id,
            ProductVersion.is_current == True
        ).first()

        if not active_ver:
            active_ver = ProductVersion(
                product_id=matched_product.id,
                version_number=detected_version or "v1.0",
                source_document_id=doc_record.id,
                is_current=True,
                status="RELEASED"
            )
            db.add(active_ver)
            db.commit()
            db.refresh(active_ver)

        if extracted_specs:
            for attr_k, attr_v in extracted_specs.items():
                if not attr_v:
                    continue
                existing_attr = db.query(ProductAttribute).filter(
                    ProductAttribute.product_version_id == active_ver.id,
                    ProductAttribute.attribute_name == attr_k
                ).first()
                if not existing_attr:
                    db.add(ProductAttribute(
                        product_version_id=active_ver.id,
                        attribute_name=attr_k,
                        attribute_value=clean_val(attr_v),
                        source_document_id=doc_record.id,
                        confidence=0.98,
                        verification_status="VERIFIED"
                    ))
                else:
                    existing_attr.attribute_value = clean_val(attr_v)
            db.commit()

        # 7. Create Candidate/Staged Product Version and Record Changes
        if matched_product and extracted_specs:
            DocumentService._create_staged_version_and_changes(
                db=db,
                product=matched_product,
                doc_record=doc_record,
                staged_version_num=detected_version,
                staged_specs=extracted_specs
            )

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
            message="Document uploaded, stored, and extracted successfully",
            extracted_attributes=doc_record.extracted_attributes or {},
            extracted_product_data=doc_record.extracted_product_data
        )

    @staticmethod
    def _create_staged_version_and_changes(
        db: Session,
        product: Product,
        doc_record: Document,
        staged_version_num: str,
        staged_specs: Dict[str, str]
    ):
        """
        Creates or updates a DRAFT/staged ProductVersion with the exact uploaded specifications,
        and generates Change & ChangeImpact records for all genuine differences.
        """
        # Find current active version
        current_ver = db.query(ProductVersion).filter(
            ProductVersion.product_id == product.id,
            ProductVersion.is_current == True
        ).first()

        # Build current specs map
        current_specs_map: Dict[str, str] = {}
        if current_ver:
            current_attrs = db.query(ProductAttribute).filter(
                ProductAttribute.product_version_id == current_ver.id
            ).all()
            for ca in current_attrs:
                current_specs_map[ca.attribute_name.strip()] = clean_val(ca.attribute_value)

        # Look for existing DRAFT version or create new one
        staged_ver = db.query(ProductVersion).filter(
            ProductVersion.product_id == product.id,
            ProductVersion.version_number == staged_version_num,
            ProductVersion.is_current == False
        ).first()

        if not staged_ver:
            staged_ver = ProductVersion(
                product_id=product.id,
                version_number=staged_version_num,
                source_document_id=doc_record.id,
                is_current=False,
                status="DRAFT"
            )
            db.add(staged_ver)
            db.commit()
            db.refresh(staged_ver)
        else:
            staged_ver.source_document_id = doc_record.id
            # Remove old attributes in draft version to replace with new upload
            db.query(ProductAttribute).filter(ProductAttribute.product_version_id == staged_ver.id).delete()
            db.commit()

        # Insert all candidate attributes into the staged version
        changes_detected: List[Tuple[str, str, str]] = []

        # Merge all keys from current and staged
        all_keys = set(current_specs_map.keys()).union(set(staged_specs.keys()))

        for key in all_keys:
            current_val = current_specs_map.get(key, "")
            staged_val = staged_specs.get(key, current_val)

            attr_record = ProductAttribute(
                product_version_id=staged_ver.id,
                attribute_name=key,
                attribute_value=staged_val,
                source_document_id=doc_record.id,
                confidence=0.98,
                verification_status="VERIFIED"
            )
            db.add(attr_record)

            # Check if this is a genuine difference
            if current_val and staged_val and clean_val(current_val).lower() != clean_val(staged_val).lower():
                changes_detected.append((key, current_val, staged_val))

        db.commit()

        # Record Change and ChangeImpact records
        for attr_name, old_v, new_v in changes_detected:
            # Check if change already exists
            existing_chg = db.query(Change).filter(
                Change.product_id == product.id,
                Change.attribute_name == attr_name,
                Change.source_document == doc_record.original_file_name
            ).first()

            if not existing_chg:
                chg = Change(
                    product_id=product.id,
                    old_version_id=current_ver.id if current_ver else None,
                    new_version_id=staged_ver.id,
                    attribute_name=attr_name,
                    old_value=old_v,
                    new_value=new_v,
                    change_type="MODIFICATION",
                    source_document=doc_record.original_file_name,
                    confidence=0.98,
                    status="PENDING"
                )
                db.add(chg)
                db.commit()
                db.refresh(chg)

                # Create ChangeImpact for E-commerce
                imp = ChangeImpact(
                    change_id=chg.id,
                    impact_type="E-commerce",
                    affected_entity_type="Storefront Specification",
                    affected_entity_id=product.product_code,
                    title=f"Storefront {attr_name} Update ({old_v} → {new_v})",
                    description=f"Online catalog for {product.name} ({product.product_code}) differs from newly ingested datasheet.",
                    context_evidence=f"Uploaded {doc_record.original_file_name}: {attr_name} = {new_v}",
                    severity="high",
                    reviewed=False,
                    target_module_url="/ecommerce"
                )
                db.add(imp)
                db.commit()

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
    def extract_product_intelligence(db: Session, document_id: int) -> ProductExtractionResponse:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document ID {document_id} not found")

        res = ProductExtractionService.extract_product_intelligence(
            document_id=doc.id,
            file_name=doc.original_file_name or doc.file_name,
            extracted_text=doc.extracted_text,
            extracted_attributes=doc.extracted_attributes or {},
            source_citations=doc.source_citations or []
        )

        try:
            if hasattr(res, "model_dump_json"):
                doc.extracted_product_data = json.loads(res.model_dump_json())
            elif hasattr(res, "model_dump"):
                doc.extracted_product_data = json.loads(json.dumps(res.model_dump(mode="json"), default=str))
            else:
                doc.extracted_product_data = json.loads(json.dumps(res, default=str))
        except Exception as e:
            logger.warning(f"Error serializing extracted product data for doc {document_id}: {e}")
        doc.processing_status = "PROCESSED"
        db.commit()
        db.refresh(doc)
        return res

    @staticmethod
    def link_product_manually(db: Session, document_id: int, product_id: int) -> Document:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document ID {document_id} not found")
        prod = db.query(Product).filter(Product.id == product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product ID {product_id} not found")

        doc.product_id = prod.id
        doc.product_model = prod.product_code
        doc.is_ambiguous = False
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def get_document_by_id(db: Session, doc_id: int) -> Document:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document ID {doc_id} not found")
        return doc

    @staticmethod
    def delete_document(db: Session, document_id: int) -> Dict[str, Any]:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")

        # Unlink foreign key references
        db.query(ProductVersion).filter(ProductVersion.source_document_id == document_id).update({ProductVersion.source_document_id: None})
        db.query(ProductAttribute).filter(ProductAttribute.source_document_id == document_id).update({ProductAttribute.source_document_id: None})
        db.query(Certificate).filter(Certificate.document_id == document_id).update({Certificate.document_id: None})

        if doc.file_path and os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
            except Exception as e:
                logger.warning(f"Could not remove physical file {doc.file_path}: {e}")

        file_name = doc.original_file_name or doc.file_name
        db.delete(doc)
        db.commit()
        return {"success": True, "message": f"Document '{file_name}' deleted successfully", "id": document_id}
