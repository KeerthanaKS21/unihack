from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.health_service import HealthService
from app.schemas.dashboard import CatalogHealthSummary

router = APIRouter(prefix="/catalog-health", tags=["Catalog Health"])

@router.get("", response_model=CatalogHealthSummary, summary="Get calculated catalog health metrics directly from database")
def get_catalog_health(db: Session = Depends(get_db)):
    """
    Returns total products, complete, missing data, conflicts, duplicates, outdated, compliance, and overall score.
    """
    return HealthService.get_catalog_health(db)
