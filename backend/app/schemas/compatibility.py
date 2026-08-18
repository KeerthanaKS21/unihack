from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class CompatibilityBase(BaseModel):
    product_id: int
    compatible_product_id: int
    relationship_type: Optional[str] = "COMPATIBLE_WITH"
    status: Optional[str] = "Compatible"
    compatibility_score: Optional[float] = 1.0
    explanation: Optional[str] = None
    affected_by_recent_change: Optional[bool] = False
    evidence_document_id: Optional[int] = None
    confidence: Optional[float] = 0.95
    verification_status: Optional[str] = "VERIFIED"

class CompatibilityCreate(CompatibilityBase):
    pass

class CompatibilityUpdate(BaseModel):
    status: Optional[str] = None
    compatibility_score: Optional[float] = None
    explanation: Optional[str] = None
    affected_by_recent_change: Optional[bool] = None

class CompatibilityResponse(CompatibilityBase):
    id: int
    created_at: datetime
    updated_at: datetime
    primary_name: Optional[str] = None
    target_name: Optional[str] = None
    target_category: Optional[str] = None
    relationship_chain: Optional[List[str]] = []
    checks: Optional[List[Dict[str, Any]]] = []

    model_config = ConfigDict(from_attributes=True)
