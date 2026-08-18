from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.database import get_db
from app.services.product_service import ProductService
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    ProductVersionCreate,
    ProductVersionResponse,
    ProductAttributeResponse
)
from app.schemas.document import DocumentResponse
from app.schemas.change import ChangeResponse
from app.schemas.certificate import CertificateResponse
from app.schemas.compatibility import CompatibilityResponse

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=ProductListResponse, summary="List products with filtering and pagination")
def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    manufacturer: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    items, total = ProductService.get_products(
        db=db,
        page=page,
        limit=limit,
        search=search,
        category=category,
        manufacturer=manufacturer,
        status=status
    )
    return ProductListResponse(total=total, page=page, limit=limit, items=items)

@router.get("/{id}", response_model=ProductResponse, summary="Get product details and 360 specs by ID")
def get_product(id: int, db: Session = Depends(get_db)):
    return ProductService.get_product_by_id(db, id)

@router.post("", response_model=ProductResponse, status_code=201, summary="Create a new industrial product")
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    return ProductService.create_product(db, data)

@router.put("/{id}", response_model=ProductResponse, summary="Update product metadata")
def update_product(id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    return ProductService.update_product(db, id, data)

@router.delete("/{id}", summary="Delete a product")
def delete_product(id: int, db: Session = Depends(get_db)):
    return ProductService.delete_product(db, id)

@router.get("/{id}/versions", response_model=List[ProductVersionResponse], summary="Get all versions of a product")
def get_product_versions(id: int, db: Session = Depends(get_db)):
    return ProductService.get_product_versions(db, id)

@router.post("/{id}/versions", response_model=ProductVersionResponse, status_code=201, summary="Create a new version for a product")
def create_product_version(id: int, data: ProductVersionCreate, db: Session = Depends(get_db)):
    return ProductService.create_product_version(db, id, data)

@router.get("/{id}/attributes", response_model=List[ProductAttributeResponse], summary="Get current technical attributes of a product")
def get_product_attributes(id: int, db: Session = Depends(get_db)):
    return ProductService.get_product_attributes(db, id)

@router.get("/{id}/documents", response_model=List[DocumentResponse], summary="Get all documents linked to a product")
def get_product_documents(id: int, db: Session = Depends(get_db)):
    return ProductService.get_product_documents(db, id)

@router.get("/{id}/changes", response_model=List[ChangeResponse], summary="Get all specification changes for a product")
def get_product_changes(id: int, db: Session = Depends(get_db)):
    return ProductService.get_product_changes(db, id)

@router.get("/{id}/compliance", response_model=List[CertificateResponse], summary="Get compliance certificates for a product")
def get_product_compliance(id: int, db: Session = Depends(get_db)):
    return ProductService.get_product_compliance(db, id)

@router.get("/{id}/compatibility", response_model=List[CompatibilityResponse], summary="Get technical compatibility relations for a product")
def get_product_compatibility(id: int, db: Session = Depends(get_db)):
    return ProductService.get_product_compatibility(db, id)
