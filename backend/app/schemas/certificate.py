from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CertificateBase(BaseModel):
    product_id: int
    document_id: Optional[int] = None
    certificate_number: str
    standard: str
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    status: Optional[str] = "VALID"
    verification_status: Optional[str] = "Compliant"
    ai_confidence: Optional[float] = 0.98
    ai_recommendation: Optional[str] = None
    issue_description: Optional[str] = None

class CertificateCreate(CertificateBase):
    pass

class CertificateUpdate(BaseModel):
    status: Optional[str] = None
    verification_status: Optional[str] = None
    expiry_date: Optional[datetime] = None
    ai_recommendation: Optional[str] = None
    issue_description: Optional[str] = None

class CertificateResponse(CertificateBase):
    id: int
    created_at: datetime
    updated_at: datetime
    product_model: Optional[str] = None
    manufacturer: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
