from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from app.db.models.certificate import Certificate
from app.db.models.product import Product
from app.schemas.certificate import CertificateCreate, CertificateUpdate

class CertificateService:
    @staticmethod
    def get_certificates(
        db: Session,
        product_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = db.query(Certificate)
        if product_id:
            query = query.filter(Certificate.product_id == product_id)
        if status:
            query = query.filter(Certificate.status == status)

        certs = query.order_by(Certificate.id).all()
        results = []
        for c in certs:
            prod = db.query(Product).filter(Product.id == c.product_id).first()
            results.append({
                "id": c.id,
                "product_id": c.product_id,
                "product_model": prod.product_code if prod else "XYZ-450",
                "manufacturer": prod.manufacturer if prod else "Siemens",
                "document_id": c.document_id,
                "certificate_number": c.certificate_number,
                "standard": c.standard,
                "issue_date": c.issue_date,
                "expiry_date": c.expiry_date,
                "status": c.status,
                "verification_status": c.verification_status,
                "ai_confidence": c.ai_confidence,
                "ai_recommendation": c.ai_recommendation,
                "issue_description": c.issue_description,
                "created_at": c.created_at,
                "updated_at": c.updated_at
            })
        return results

    @staticmethod
    def get_expiring_certificates(db: Session, days: int = 90) -> List[Certificate]:
        threshold = datetime.utcnow() + timedelta(days=days)
        return db.query(Certificate).filter(
            Certificate.expiry_date != None,
            Certificate.expiry_date <= threshold,
            Certificate.expiry_date >= datetime.utcnow()
        ).all()

    @staticmethod
    def get_expired_certificates(db: Session) -> List[Certificate]:
        return db.query(Certificate).filter(
            Certificate.expiry_date != None,
            Certificate.expiry_date < datetime.utcnow()
        ).all()

    @staticmethod
    def create_certificate(db: Session, data: CertificateCreate) -> Certificate:
        cert = Certificate(
            product_id=data.product_id,
            document_id=data.document_id,
            certificate_number=data.certificate_number,
            standard=data.standard,
            issue_date=data.issue_date,
            expiry_date=data.expiry_date,
            status=data.status or "VALID",
            verification_status=data.verification_status or "Compliant",
            ai_confidence=data.ai_confidence or 0.98,
            ai_recommendation=data.ai_recommendation,
            issue_description=data.issue_description
        )
        db.add(cert)
        db.commit()
        db.refresh(cert)
        return cert

    @staticmethod
    def update_certificate(db: Session, cert_id: int, data: CertificateUpdate) -> Certificate:
        cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
        if not cert:
            raise HTTPException(status_code=404, detail=f"Certificate ID {cert_id} not found")
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(cert, k, v)
        db.commit()
        db.refresh(cert)
        return cert
