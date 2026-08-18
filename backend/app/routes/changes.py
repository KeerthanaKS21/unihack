from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.db.database import get_db
from app.services.change_service import ChangeService
from app.schemas.change import ChangeCreate, ChangeResponse

router = APIRouter(prefix="/changes", tags=["Changes"])

@router.get("", response_model=List[ChangeResponse], summary="List all detected specification changes")
def list_changes(
    product_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return ChangeService.get_changes(db, product_id, status)

@router.get("/{id}", response_model=ChangeResponse, summary="Get change record by ID")
def get_change(id: int, db: Session = Depends(get_db)):
    return ChangeService.get_change_by_id(db, id)

@router.post("", response_model=ChangeResponse, status_code=201, summary="Create a new change record")
def create_change(data: ChangeCreate, db: Session = Depends(get_db)):
    return ChangeService.create_change(db, data)
