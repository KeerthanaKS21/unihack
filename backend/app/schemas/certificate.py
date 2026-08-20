from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class CertificateBase(BaseModel):
    product_id: int
    document_id: Optional[int] = None
    certificate_number: str
    certificate_type: Optional[str] = "Safety Certificate"
    standard: str
    certification_body: Optional[str] = None
    scope: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    status: Optional[str] = "VALID"
    verification_status: Optional[str] = "Compliant"
    ai_confidence: Optional[float] = 0.98
    ai_recommendation: Optional[str] = None
    issue_description: Optional[str] = None
    conflict_details: Optional[Dict[str, Any]] = None
    replacement_candidate_id: Optional[int] = None
    resolution_notes: Optional[str] = None

class CertificateCreate(CertificateBase):
    pass

class CertificateUpdate(BaseModel):
    certificate_number: Optional[str] = None
    standard: Optional[str] = None
    certification_body: Optional[str] = None
    status: Optional[str] = None
    verification_status: Optional[str] = None
    expiry_date: Optional[datetime] = None
    ai_recommendation: Optional[str] = None
    issue_description: Optional[str] = None
    conflict_details: Optional[Dict[str, Any]] = None
    resolution_notes: Optional[str] = None

class CertificateResponse(CertificateBase):
    id: int
    created_at: datetime
    updated_at: datetime
    product_model: Optional[str] = None
    manufacturer: Optional[str] = None
    document_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ComplianceSummaryResponse(BaseModel):
    total_products: int
    compliant: int
    needs_review: int
    missing_certificates: int
    expired_certificates: int
    conflicts: int
    invalid_certificates: int

class ComplianceRequirementCheck(BaseModel):
    name: str
    specification_found: bool
    specification_value: str
    evidence_status: str # VERIFIED, EVIDENCE_MISSING, MISSING_SPEC, CONFLICT, EXPIRED, NOT_APPLICABLE
    status_label: str # ✅ Verified, ⚠ Evidence Missing, ❌ Specification Missing, ⚠ Conflict, 🔴 Expired, N/A
    source_document: str
    source_page: Optional[str] = None
    certificate_number: Optional[str] = None
    certificate_body: Optional[str] = None
    expiry_date: Optional[str] = None
    action_required: Optional[str] = None

class ProductComplianceItem(BaseModel):
    product_id: int
    product_name: str
    product_model: str
    manufacturer: str
    compliance_status: str # COMPLIANT, NEEDS REVIEW, NON-COMPLIANT, EXPIRED
    missing_requirements: List[str] = Field(default_factory=list)
    evidence_missing_requirements: List[str] = Field(default_factory=list)
    certificate_status: str
    expiry_date: Optional[str] = None
    last_verified: str
    certificates_count: int

class ComplianceResolveRequest(BaseModel):
    certificate_id: Optional[int] = None
    product_id: Optional[int] = None
    action_type: str # APPROVE_ASSOCIATION, APPROVE_REPLACEMENT, MANUAL_ENTRY, RESOLVE_CONFLICT, ATTACH_DOCUMENT, DISMISS
    value: Optional[str] = None
    standard: Optional[str] = None
    certification_body: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    scope: Optional[str] = None
    spec_value: Optional[str] = None
    temp_range: Optional[str] = None
    atex_rating: Optional[str] = None
    rohs_status: Optional[str] = None
    safety_standard: Optional[str] = None
    notes: Optional[str] = None
    replacement_document_id: Optional[int] = None
