from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.services.issue_service import IssueService
from app.schemas.issue import (
    CatalogIssueResponse,
    CatalogIssueListResponse,
    CatalogIssueResolveRequest
)

router = APIRouter(prefix="/catalog-issues", tags=["Catalog Issues"])

@router.get("", response_model=CatalogIssueListResponse, summary="List catalog issues with filtering and pagination")
def list_issues(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    issue_type: Optional[str] = Query(None, description="conflict, missing, duplicate, invalid_unit, wrong_category, outdated, compliance, broken_relationship, low_confidence"),
    status: Optional[str] = Query(None, description="open, in_review, resolved, rejected, all"),
    severity: Optional[str] = Query(None),
    product_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    items, total = IssueService.get_issues(
        db=db,
        page=page,
        limit=limit,
        issue_type=issue_type,
        status=status,
        severity=severity,
        product_id=product_id,
        search=search
    )
    return CatalogIssueListResponse(total=total, page=page, limit=limit, items=items)

@router.get("/{id}", response_model=CatalogIssueResponse, summary="Get catalog issue details by ID")
def get_issue(id: int, db: Session = Depends(get_db)):
    return IssueService.get_issue_by_id(db, id)

@router.post("/{id}/resolve", summary="Resolve a catalog issue with human-in-the-loop value")
def resolve_issue(
    id: int,
    req: CatalogIssueResolveRequest,
    db: Session = Depends(get_db)
):
    """
    1-click resolution endpoint. Updates issue status to 'resolved', stores chosen value,
    applies real database correction, and writes audit/approval record.
    """
    return IssueService.resolve_issue(db, id, req)
