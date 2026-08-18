from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.db.database import get_db
from app.services.quote_service import QuoteService
from app.schemas.quote import (
    QuoteCreate,
    QuoteResponse,
    QuoteRevisionRequest,
    QuoteItemCreate,
    QuoteItemResponse
)

router = APIRouter(prefix="/quotes", tags=["Quotes"])

@router.get("", response_model=List[QuoteResponse], summary="List all generated industrial quotations")
def list_quotes(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return QuoteService.get_quotes(db, status)

@router.get("/{id}", response_model=QuoteResponse, summary="Get quotation details and line items by ID")
def get_quote(id: int, db: Session = Depends(get_db)):
    return QuoteService.get_quote_by_id(db, id)

@router.post("", response_model=QuoteResponse, status_code=201, summary="Create a new quote record")
def create_quote(data: QuoteCreate, db: Session = Depends(get_db)):
    return QuoteService.create_quote(db, data)

@router.post("/{id}/approve", response_model=QuoteResponse, summary="Approve an industrial quote for dispatch")
def approve_quote(
    id: int,
    approved_by: Optional[str] = Query("Sales Operations"),
    db: Session = Depends(get_db)
):
    return QuoteService.approve_quote(db, id, approved_by)

@router.post("/{id}/request-revision", response_model=QuoteResponse, summary="Simulate quotation revision (adjust quantity/lead time)")
def request_revision(
    id: int,
    req: QuoteRevisionRequest,
    db: Session = Depends(get_db)
):
    """
    Modifies quantity and delivery days, checks inventory rules, and increments quotation version (e.g. v1.0 -> v2.0).
    """
    return QuoteService.request_revision(db, id, req)

@router.get("/{id}/items", response_model=List[QuoteItemResponse], summary="Get quote line items")
def get_quote_items(id: int, db: Session = Depends(get_db)):
    return QuoteService.get_quote_items(db, id)

@router.post("/{id}/items", response_model=QuoteItemResponse, status_code=201, summary="Add a line item to a quote")
def add_quote_item(id: int, data: QuoteItemCreate, db: Session = Depends(get_db)):
    return QuoteService.add_quote_item(db, id, data)
