from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.database import get_db
from app.services.supplier_service import SupplierService
from app.schemas.supplier import (
    SupplierCreate,
    SupplierUpdate,
    SupplierResponse,
    SupplierProductCreate,
    SupplierProductResponse
)

router = APIRouter(tags=["Suppliers"])

@router.get("/suppliers", response_model=List[SupplierResponse], summary="List all suppliers")
def list_suppliers(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return SupplierService.get_suppliers(db, status)

@router.get("/suppliers/{id}", response_model=SupplierResponse, summary="Get supplier details by ID")
def get_supplier(id: int, db: Session = Depends(get_db)):
    return SupplierService.get_supplier_by_id(db, id)

@router.post("/suppliers", response_model=SupplierResponse, status_code=201, summary="Register a new supplier")
def create_supplier(data: SupplierCreate, db: Session = Depends(get_db)):
    return SupplierService.create_supplier(db, data)

@router.put("/suppliers/{id}", response_model=SupplierResponse, summary="Update supplier metadata")
def update_supplier(id: int, data: SupplierUpdate, db: Session = Depends(get_db)):
    return SupplierService.update_supplier(db, id, data)

@router.get("/suppliers/{id}/products", response_model=List[SupplierProductResponse], summary="List all products offered by a specific supplier")
def list_supplier_products_by_supplier(id: int, db: Session = Depends(get_db)):
    return SupplierService.get_supplier_products(db, supplier_id=id)

@router.get("/supplier-products", response_model=List[SupplierProductResponse], summary="Parametric search across all supplier offerings")
def list_supplier_products(
    supplier_id: Optional[int] = Query(None),
    product_id: Optional[int] = Query(None),
    max_price: Optional[float] = Query(None),
    max_delivery_days: Optional[int] = Query(None),
    in_stock_only: Optional[bool] = Query(False),
    db: Session = Depends(get_db)
):
    """
    Supports Procurement & Supplier Comparison matrix with exact matches vs closest alternatives.
    """
    return SupplierService.get_supplier_products(
        db=db,
        supplier_id=supplier_id,
        product_id=product_id,
        max_price=max_price,
        max_delivery_days=max_delivery_days,
        in_stock_only=in_stock_only
    )

@router.post("/supplier-products", response_model=SupplierProductResponse, status_code=201, summary="Link a supplier offering to a catalog product")
def create_supplier_product(data: SupplierProductCreate, db: Session = Depends(get_db)):
    return SupplierService.create_supplier_product(db, data)
