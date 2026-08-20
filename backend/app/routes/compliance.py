from fastapi import APIRouter, Depends, Query, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.database import get_db
from app.services.compliance_service import ComplianceService
from app.schemas.certificate import (
    ComplianceSummaryResponse,
    ProductComplianceItem,
    ComplianceResolveRequest
)

router = APIRouter(prefix="/compliance", tags=["Compliance Auditing"])

@router.get("/summary", response_model=ComplianceSummaryResponse, summary="Get high-level compliance KPI metrics")
def get_compliance_summary(db: Session = Depends(get_db)):
    return ComplianceService.get_summary(db)

@router.get("/products", response_model=List[ProductComplianceItem], summary="Get list of products with compliance statuses")
def get_product_compliance_list(
    status: Optional[str] = Query(None, description="all, compliant, needs_review, non_compliant, expired"),
    search: Optional[str] = Query(None, description="Search model, product name, manufacturer"),
    db: Session = Depends(get_db)
):
    return ComplianceService.get_product_compliance_list(db, status, search)

@router.get("/products/{id}", summary="Get detailed compliance inspection breakdown for a specific product")
def get_product_compliance_detail(id: int, db: Session = Depends(get_db)):
    return ComplianceService.get_product_compliance_detail(db, id)

@router.post("/upload-file", summary="Upload actual compliance file (PDF, CSV, Image), extract missing data, and match product")
async def upload_file_and_extract(
    file: UploadFile = File(...),
    product_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    return await ComplianceService.process_uploaded_compliance_file(db, file, product_id)

@router.post("/upload-match", summary="Upload compliance certificate and perform fuzzy product matching")
def upload_and_match_certificate(
    file_name: Optional[str] = Form(None),
    product_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    fn = file_name or "IEC_Safety_Certificate_2026.pdf"
    return ComplianceService.match_and_attach_certificate(db, fn, product_id)

@router.post("/resolve", summary="Resolve a compliance item (approve replacement, manual entry, resolve conflict)")
def resolve_compliance_action(data: ComplianceResolveRequest, db: Session = Depends(get_db)):
    return ComplianceService.resolve_action(
        db=db,
        certificate_id=data.certificate_id,
        product_id=data.product_id,
        action_type=data.action_type,
        value=data.value,
        standard=data.standard,
        certification_body=data.certification_body,
        issue_date=data.issue_date,
        expiry_date=data.expiry_date,
        scope=data.scope,
        spec_value=data.spec_value,
        temp_range=data.temp_range,
        atex_rating=data.atex_rating,
        rohs_status=data.rohs_status,
        safety_standard=data.safety_standard,
        notes=data.notes,
        replacement_document_id=data.replacement_document_id
    )
