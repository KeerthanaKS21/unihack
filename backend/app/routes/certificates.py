from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.database import get_db
from app.services.certificate_service import CertificateService
from app.schemas.certificate import CertificateCreate, CertificateUpdate, CertificateResponse

router = APIRouter(prefix="/certificates", tags=["Certificates & Compliance"])

@router.get("", response_model=List[CertificateResponse], summary="List compliance certificates")
def list_certificates(
    product_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None, description="VALID, EXPIRING, EXPIRED, MISSING"),
    db: Session = Depends(get_db)
):
    return CertificateService.get_certificates(db, product_id, status)

@router.get("/expiring", summary="Get certificates expiring within 90 days")
def list_expiring_certificates(
    days: int = Query(90, ge=1, le=365),
    db: Session = Depends(get_db)
):
    return CertificateService.get_expiring_certificates(db, days)

@router.get("/expired", summary="Get expired certificates")
def list_expired_certificates(db: Session = Depends(get_db)):
    return CertificateService.get_expired_certificates(db)

@router.post("", response_model=CertificateResponse, status_code=201, summary="Register a compliance certificate")
def create_certificate(data: CertificateCreate, db: Session = Depends(get_db)):
    return CertificateService.create_certificate(db, data)

@router.put("/{id}", response_model=CertificateResponse, summary="Update certificate status or standard")
def update_certificate(id: int, data: CertificateUpdate, db: Session = Depends(get_db)):
    return CertificateService.update_certificate(db, id, data)
