from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class ChangeBase(BaseModel):
    product_id: int
    old_version_id: Optional[int] = None
    new_version_id: Optional[int] = None
    attribute_name: str
    old_value: Optional[str] = None
    new_value: str
    change_type: Optional[str] = "MODIFIED"
    source_document: Optional[str] = None
    confidence: Optional[float] = 0.98
    status: Optional[str] = "PENDING"

class ChangeCreate(ChangeBase):
    pass

class ChangeResponse(ChangeBase):
    id: int
    created_at: datetime
    product_code: Optional[str] = None
    product_name: Optional[str] = None
    detected_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ChangeImpactBase(BaseModel):
    change_id: int
    impact_type: str
    affected_entity_type: Optional[str] = None
    affected_entity_id: Optional[str] = None
    title: str
    description: str
    context_evidence: Optional[str] = None
    severity: Optional[str] = "medium"
    reviewed: Optional[bool] = False
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    target_module_url: Optional[str] = None

class ChangeImpactCreate(ChangeImpactBase):
    pass

class ChangeImpactReviewRequest(BaseModel):
    reviewed: bool = True
    reviewed_by: Optional[str] = "Engineering Lead"
    comments: Optional[str] = None

class ChangeImpactResponse(ChangeImpactBase):
    id: int
    created_at: datetime
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    change_description: Optional[str] = None
    domain: Optional[str] = None
    explanation: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PendingImpactCountResponse(BaseModel):
    total_impacts: int
    reviewed_impacts: int
    unreviewed_impacts: int
