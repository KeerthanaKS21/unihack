from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.health_service import HealthService
from app.schemas.dashboard import CatalogHealthSummary

router = APIRouter(prefix="/catalog-health", tags=["Catalog Health"])

@router.get("", response_model=CatalogHealthSummary, summary="Get calculated catalog health metrics directly from database")
def get_catalog_health(db: Session = Depends(get_db)):
    """
    Returns real, database-calculated metrics: total products, complete products,
    products with issues, issue breakdowns, component scores, and explainable health score.
    """
    return HealthService.get_catalog_health(db)

@router.post("/scan", summary="Trigger a real-time catalog quality scan across all products")
def scan_catalog_health(db: Session = Depends(get_db)):
    """
    Executes a real-time scan across all products, versions, attributes, certificates,
    and relationships in PostgreSQL.
    """
    scan_res = HealthService.scan_and_detect_issues(db)
    health = HealthService.get_catalog_health(db)
    return {
        "status": "SUCCESS",
        "scan_results": scan_res,
        "catalog_health": health
    }
