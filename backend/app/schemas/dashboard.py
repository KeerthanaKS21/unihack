from pydantic import BaseModel
from typing import List, Dict, Any

class CatalogHealthSummary(BaseModel):
    total_products: int = 10000
    complete_products: int = 8200
    missing_data: int = 800
    conflicts: int = 350
    duplicates: int = 250
    outdated: int = 300
    compliance_issues: int = 63
    overall_health: int = 91

class DashboardSummaryResponse(BaseModel):
    total_products: int
    total_suppliers: int
    pending_approvals: int
    catalog_health: CatalogHealthSummary
    unresolved_issues: int
    pending_change_impacts: int
    recent_documents: List[Dict[str, Any]]
    recent_changes: List[Dict[str, Any]]
    compliance_issues: int
    categories_breakdown: List[Dict[str, Any]]
    trend_history: List[Dict[str, Any]]
