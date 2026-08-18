from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import DashboardSummaryResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse, summary="Get aggregated metrics for executive dashboard")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Returns:
    - total products
    - total suppliers
    - pending approvals
    - catalog health summary
    - unresolved issues
    - pending change impacts
    - recent documents
    - recent changes
    - compliance issues
    """
    return DashboardService.get_dashboard_summary(db)
