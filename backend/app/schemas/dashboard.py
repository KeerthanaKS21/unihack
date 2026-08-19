from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class HealthComponents(BaseModel):
    completeness: float = 100.0
    consistency: float = 100.0
    validity: float = 100.0
    freshness: float = 100.0
    compliance: float = 100.0
    confidence: float = 100.0

class IssueCounts(BaseModel):
    missing_data: int = 0
    conflicts: int = 0
    duplicates: int = 0
    outdated: int = 0
    invalid_units: int = 0
    invalid_values: int = 0
    wrong_category: int = 0
    broken_relationships: int = 0
    compliance: int = 0
    image_data_mismatch: int = 0
    low_confidence: int = 0

class CatalogHealthSummary(BaseModel):
    total_products: int = 0
    products_monitored: int = 0
    complete_products: int = 0
    products_with_issues: int = 0
    
    # Flat backward-compatible count fields
    missing_data: int = 0
    conflicts: int = 0
    duplicates: int = 0
    outdated: int = 0
    compliance_issues: int = 0
    invalid_units: int = 0
    invalid_values: int = 0
    wrong_category: int = 0
    broken_relationships: int = 0
    image_mismatch: int = 0
    low_confidence: int = 0
    
    overall_health: float = 100.0
    health_score: float = 100.0
    
    issues: IssueCounts = IssueCounts()
    components: HealthComponents = HealthComponents()

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
