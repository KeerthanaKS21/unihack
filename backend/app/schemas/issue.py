from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class CatalogIssueBase(BaseModel):
    product_id: int
    issue_type: str
    attribute_name: Optional[str] = None
    title: str
    description: str
    sources: Optional[List[Dict[str, Any]]] = []
    ai_recommendation: Optional[Dict[str, Any]] = {}
    evidence: Optional[str] = None
    severity: Optional[str] = "medium"
    status: Optional[str] = "open"

class CatalogIssueCreate(CatalogIssueBase):
    pass

class CatalogIssueResolveRequest(BaseModel):
    resolution_value: str
    comments: Optional[str] = None
    resolved_by: Optional[str] = "Engineering Lead"

class CatalogIssueResponse(CatalogIssueBase):
    id: int
    product_model: Optional[str] = None
    field: Optional[str] = None
    resolution_value: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CatalogIssueListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[CatalogIssueResponse]
