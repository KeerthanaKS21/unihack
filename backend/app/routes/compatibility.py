from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.database import get_db
from app.services.compatibility_service import CompatibilityService
from app.schemas.compatibility import (
    CompatibilityCreate,
    CompatibilityUpdate,
    CompatibilityResponse
)

router = APIRouter(prefix="/compatibility", tags=["Compatibility"])

@router.get("/{product_id}", response_model=List[CompatibilityResponse], summary="Get drivetrain compatibility topology and checks for a product")
def get_product_compatibility(product_id: int, db: Session = Depends(get_db)):
    """
    Returns 4-node drivetrain topology relations and multi-point parameter checks.
    """
    return CompatibilityService.get_compatibility_for_product(db, product_id)

@router.post("", summary="Create a new compatibility rule")
def create_compatibility(data: CompatibilityCreate, db: Session = Depends(get_db)):
    return CompatibilityService.create_compatibility(db, data)

@router.put("/{id}", summary="Update a compatibility rule")
def update_compatibility(id: int, data: CompatibilityUpdate, db: Session = Depends(get_db)):
    return CompatibilityService.update_compatibility(db, id, data)

@router.delete("/{id}", summary="Delete a compatibility rule")
def delete_compatibility(id: int, db: Session = Depends(get_db)):
    return CompatibilityService.delete_compatibility(db, id)
