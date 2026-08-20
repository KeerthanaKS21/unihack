from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class CatalogHealthSummary(BaseModel):
    total_products: int = 0
    products_monitored: int = 0
    complete_products: int = 0
    products_with_issues: int = 0
    missing_data: int = 0
    conflicts: int = 0
    duplicates: int = 0
    outdated: int = 0
    compliance_issues: int = 0
    overall_health: float = 100.0
    health_score: float = 100.0

class DashboardSummaryResponse(BaseModel):
    total_products: int
    total_documents: int
    products_needing_review: int
    catalog_health_score: float
    compliance_issues: int
    pending_sync: int
    pending_ecommerce: int
    unreviewed_impacts: int
    total_suppliers: int
    catalog_health: Dict[str, Any]
    pending_actions: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
    recent_changes: List[Dict[str, Any]]
    procurement_overview: Dict[str, Any]
    quote_overview: Dict[str, Any]
    has_trend_data: bool
    trend_message: Optional[str] = None
    trend_history: List[Dict[str, Any]]
    last_updated: str
