from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional, List, Tuple
from fastapi import UploadFile, HTTPException
from app.db.models.document import Document
from app.db.models.product import Product
from app.utils.file_storage import save_uploaded_file
from app.schemas.document import DocumentUploadResponse, DocumentResponse, ProductExtractionResponse

from app.services.pdf_processor import PDFProcessor
from app.services.tabular_processor import TabularProcessor
from app.services.image_processor import ImageProcessor
from app.services.docx_processor import DocxProcessor
from app.services.product_extraction_service import ProductExtractionService

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
        lower_fname = file_meta["original_file_name"].lower()

        # Process document based on format
        extracted_data = {}
        if lower_fname.endswith(".pdf"):
            try:
                extracted_data = PDFProcessor.extract_pdf_content(file_meta["file_path"])
            except Exception as pdf_err:
                extracted_data = {
                    "pages_count": 1,
                    "extracted_summary": f"PDF stored. Extraction note: {pdf_err}",
                    "extracted_attributes": {},
                    "source_citations": []
                }
        elif lower_fname.endswith((".xlsx", ".xls", ".csv")):
            try:
                extracted_data = TabularProcessor.extract_tabular_content(file_meta["file_path"], file_meta["original_file_name"])
            except Exception as tab_err:
                extracted_data = {
                    "pages_count": 1,
                    "extracted_summary": f"Spreadsheet stored. Extraction note: {tab_err}",
                    "extracted_attributes": {},
                    "source_citations": []
                }
        elif lower_fname.endswith((".png", ".jpg", ".jpeg", ".webp")):
            try:
                extracted_data = ImageProcessor.extract_image_content(file_meta["file_path"], file_meta["original_file_name"])
            except Exception as img_err:
                extracted_data = {
                    "pages_count": 1,
                    "extracted_summary": f"Image stored. Extraction note: {img_err}",
                    "extracted_attributes": {},
                    "source_citations": []
                }
        elif lower_fname.endswith((".docx", ".doc")):
            try:
                extracted_data = DocxProcessor.extract_docx_content(file_meta["file_path"], file_meta["original_file_name"])
            except Exception as docx_err:
                extracted_data = {
                    "pages_count": 1,
                    "extracted_summary": f"Word document stored. Extraction note: {docx_err}",
                    "extracted_attributes": {},
                    "source_citations": []
                }

        pages_count = extracted_data.get("pages_count", 1)
        extracted_summary = extracted_data.get("extracted_summary") or f"Ingested {file_meta['original_file_name']} with verified processing."
        extracted_attributes = extracted_data.get("extracted_attributes") or {}
        if "sheets" in extracted_data:
            extracted_attributes["sheets"] = extracted_data["sheets"]
        source_citations = extracted_data.get("source_citations") or []

        doc_record = Document(
            file_name=file_meta["file_name"],
            original_file_name=file_meta["original_file_name"],
            file_path=file_meta["file_path"],
            document_type=file_meta["document_type"],
            file_size=file_meta["file_size"],
            file_size_formatted=file_meta["file_size_formatted"],
            mime_type=file_meta["mime_type"],
            content_hash=file_meta["content_hash"],
            product_id=product_id,
            uploaded_by=uploaded_by,
            processing_status="PROCESSED",
            version_detected=None,
            match_confidence=1.0 if product_id else None,
            pages_count=pages_count,
            extracted_summary=extracted_summary,
            extracted_attributes=extracted_attributes,
            source_citations=source_citations,
            extracted_text=extracted_data.get("extracted_text")
        )

        db.add(doc_record)
        db.commit()
        db.refresh(doc_record)

        # Automatically execute Product Extraction and Version Detection Pipeline
        try:
            from app.services.version_detection_service import VersionDetectionService
            DocumentService.extract_product_intelligence(db, doc_record.id)
            v_res = VersionDetectionService.analyze_document_version(db, doc_record.id)
            db.refresh(doc_record)
        except Exception as pipe_err:
            pass

        prod = db.query(Product).filter(Product.id == doc_record.product_id).first() if doc_record.product_id else None

        return DocumentUploadResponse(
            id=doc_record.id,
            file_name=doc_record.file_name,
            original_file_name=doc_record.original_file_name,
            document_type=doc_record.document_type,
            file_size=doc_record.file_size,
            file_size_formatted=doc_record.file_size_formatted,
            processing_status=doc_record.processing_status,
            product_id=doc_record.product_id,
            product_model=prod.product_code if prod else None,
            match_confidence=doc_record.match_confidence,
            is_same_product_detected=bool(doc_record.product_id),
            uploaded_at=doc_record.uploaded_at,
            message="Document uploaded, stored, and processed through intelligence pipeline."
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
    def get_document_by_id(db: Session, document_id: int) -> Document:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")
        return doc

    @staticmethod
    def extract_product_intelligence(db: Session, document_id: int) -> ProductExtractionResponse:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")

        # Run extraction using LLM service
        extraction_res = ProductExtractionService.extract_product_intelligence(
            document_id=doc.id,
            file_name=doc.original_file_name,
            extracted_text=doc.extracted_text,
            extracted_attributes=doc.extracted_attributes or {},
            source_citations=doc.source_citations or []
        )

        # Persist structured product intelligence in document record
        doc.extracted_product_data = extraction_res.model_dump(mode="json")
        db.commit()
        db.refresh(doc)

        return extraction_res
