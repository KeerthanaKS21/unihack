from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models.product import ProductVersion
from app.schemas.product import ProductVersionResponse

router = APIRouter(prefix="/product-versions", tags=["Product Versions"])

@router.get("/{id}", response_model=ProductVersionResponse, summary="Get product version by ID")
def get_version(id: int, db: Session = Depends(get_db)):
    version = db.query(ProductVersion).filter(ProductVersion.id == id).first()
    if not version:
        raise HTTPException(status_code=404, detail=f"Product Version ID {id} not found")
    return version
