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

class AttributeComparison(BaseModel):
    attribute_name: str
    is_mandatory: bool = True
    product_a_value: Optional[str] = None
    product_a_source: Optional[str] = None
    product_b_value: Optional[str] = None
    product_b_source: Optional[str] = None
    status: str  # PASS, FAIL, CONFLICT, MISSING, REVIEW
    explanation: str

class AlternativeProductRecommendation(BaseModel):
    product_id: int
    product_code: str
    name: str
    manufacturer: str
    category: str
    specs_summary: str
    reason: str

class CompatibilityEvaluationRequest(BaseModel):
    product_a_id: int
    product_b_id: int

class CompatibilityEvaluationResponse(BaseModel):
    product_a_id: int
    product_a_code: str
    product_a_name: str
    product_a_category: str
    product_b_id: int
    product_b_code: str
    product_b_name: str
    product_b_category: str
    result: str  # COMPATIBLE, NOT_COMPATIBLE, NEEDS_REVIEW, INSUFFICIENT_DATA
    overall_status_label: str
    overall_score: float
    summary_reason: str
    attribute_comparisons: List[AttributeComparison]
    missing_attributes: List[str]
    conflicting_attributes: List[Dict[str, Any]]
    alternative_recommendations: List[AlternativeProductRecommendation]
    evaluated_at: str

class SystemCompatibilityRequest(BaseModel):
    product_ids: List[int]

class NaturalLanguageQueryRequest(BaseModel):
    query: str
