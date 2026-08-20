from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.services.document_service import DocumentService
from app.schemas.document import (
    DocumentUploadResponse,
    DocumentListResponse,
    DocumentResponse,
    ProductExtractionResponse
)

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentUploadResponse, summary="Upload and store an industrial document")
async def upload_document(
    file: UploadFile = File(..., description="Multipart file upload (PDF, Excel, Images, CAD)"),
    product_id: Optional[int] = Form(None, description="Optional associated product ID"),
    uploaded_by: Optional[str] = Form("System / Engineering Lead", description="Uploader name/role"),
    db: Session = Depends(get_db)
):
    """
    1. Accepts multipart file upload.
    2. Validates allowed file extensions and maximum size limit.
    3. Computes SHA-256 content hash to prevent duplicate corruption.
    4. Generates a safe server-side filename and stores file in `uploads/`.
    5. Creates a document database record.
    6. Returns structured document metadata.
    """
    return await DocumentService.upload_document(db, file, product_id, uploaded_by)

@router.get("", response_model=DocumentListResponse, summary="List uploaded documents with pagination and filtering")
def list_documents(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term for filename or uploader"),
    document_type: Optional[str] = Query(None, description="Filter by document type (DATASHEET, CERTIFICATE, etc.)"),
    processing_status: Optional[str] = Query(None, description="Filter by status (UPLOADED, PROCESSING, PROCESSED)"),
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    db: Session = Depends(get_db)
):
    """
    Powers the Upload History table in the frontend.
    """
    items, total = DocumentService.get_documents(
        db=db,
        page=page,
        limit=limit,
        search=search,
        document_type=document_type,
        processing_status=processing_status,
        product_id=product_id
    )
    return DocumentListResponse(total=total, page=page, limit=limit, items=items)

@router.get("/{id}", response_model=DocumentResponse, summary="Get document metadata by ID")
def get_document(id: int, db: Session = Depends(get_db)):
    return DocumentService.get_document_by_id(db, id)

@router.post("/{id}/link-product", response_model=DocumentResponse, summary="Manually link an ambiguous document to a product")
def link_document(id: int, product_id: int = Query(...), db: Session = Depends(get_db)):
    return DocumentService.link_product_manually(db, id, product_id)

@router.post("/{id}/extract-product", response_model=ProductExtractionResponse, summary="Extract standardized structured product intelligence using LLM")
def extract_product_from_document(id: int, db: Session = Depends(get_db)):
    """
    Step 5 LLM-Powered Product Extraction:
    1. Retrieves document and its extracted content (text/tables/OCR).
    2. Sends context to LLM with strict anti-hallucination and JSON schema rules.
    3. Validates and returns standardized ProductIdentity and Specifications.
    4. Persists the structured product data to the document record.
    """
    return DocumentService.extract_product_intelligence(db, id)

@router.post("/{id}/identify-product", summary="Identify matching Master Catalog product based on multi-factor evidence")
def identify_product(id: int, db: Session = Depends(get_db)):
    """
    Stage 1: Multi-factor evidence product identification.
    """
    from app.services.product_identification_service import ProductIdentificationService
    doc = DocumentService.get_document_by_id(db, id)
    if not doc.extracted_product_data:
        DocumentService.extract_product_intelligence(db, id)
    return ProductIdentificationService.identify_product_for_document(db, id)

@router.post("/{id}/detect-version", summary="Perform unit normalization, version detection, diff detection, and impact generation")
def detect_version(id: int, db: Session = Depends(get_db)):
    """
    Stages 2, 3, 4, 7:
    - Normalizes specification values using Pint.
    - Compares against active Master Catalog version.
    - Computes diffs (MODIFIED, UNCHANGED, ADDED).
    - Generates downstream impacts across Compatibility, E-commerce, Procurement, and Quotes.
    """
    from app.services.version_detection_service import VersionDetectionService
    doc = DocumentService.get_document_by_id(db, id)
    if not doc.extracted_product_data:
        DocumentService.extract_product_intelligence(db, id)
    return VersionDetectionService.analyze_document_version(db, id)

@router.post("/{id}/approve-sync", summary="Human approval of candidate version synchronization")
def approve_sync(
    id: int,
    approved_by: Optional[str] = Query("Lead Systems Engineer"),
    comments: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Stage 9: Human Approval of Synchronization:
    Promotes candidate version to active, archives previous version, marks changes APPROVED.
    """
    from app.services.version_detection_service import VersionDetectionService
    return VersionDetectionService.approve_synchronization(db, id, approved_by=approved_by, comments=comments)
