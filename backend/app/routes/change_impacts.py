from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.database import get_db
from app.services.change_service import ChangeService
from app.schemas.change import (
    ChangeImpactResponse,
    ChangeImpactReviewRequest,
    PendingImpactCountResponse
)

router = APIRouter(prefix="/change-impacts", tags=["Change Impacts"])

@router.get("", response_model=List[ChangeImpactResponse], summary="List operational change impacts across 5 domains")
def list_change_impacts(
    change_id: Optional[int] = Query(None),
    reviewed: Optional[bool] = Query(None),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return ChangeService.get_change_impacts(db, change_id, reviewed, severity)

@router.get("/pending-count", response_model=PendingImpactCountResponse, summary="Get total reviewed and unreviewed impacts count")
def get_pending_impact_count(db: Session = Depends(get_db)):
    """
    Powers the sidebar and topbar notification badge counter.
    """
    return ChangeService.get_pending_impact_count(db)

@router.post("/{id}/review", summary="Mark an individual change impact as reviewed/unreviewed")
def review_change_impact(
    id: int,
    req: ChangeImpactReviewRequest,
    db: Session = Depends(get_db)
):
    """
    Human-in-the-loop sign-off on an operational impact.
    Decrements unreviewed impacts counter.
    """
    return ChangeService.review_change_impact(db, id, req)
