from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class SupplierBase(BaseModel):
    name: str
    supplier_code: str
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tier: Optional[str] = "Authorized Partner"
    rating: Optional[float] = 4.5
    status: Optional[str] = "ACTIVE"

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tier: Optional[str] = None
    rating: Optional[float] = None
    status: Optional[str] = None

class SupplierProductBase(BaseModel):
    supplier_id: int
    product_id: int
    supplier_product_code: str
    price: float
    currency: Optional[str] = "INR"
    stock_quantity: Optional[int] = 0
    delivery_days: Optional[int] = 7
    minimum_order_quantity: Optional[int] = 1
    technical_match_score: Optional[float] = 1.0
    is_exact_match: Optional[str] = "Exact Match"
    supplier_status: Optional[str] = "AVAILABLE"
    advantage_notes: Optional[str] = None

class SupplierProductCreate(SupplierProductBase):
    pass

class SupplierProductResponse(SupplierProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    supplier_name: Optional[str] = None
    product_model: Optional[str] = None
    product_name: Optional[str] = None
    power: Optional[str] = None
    voltage: Optional[str] = None
    ip_rating: Optional[str] = None
    speed: Optional[str] = None
    tier: Optional[str] = "Authorized Partner"
    rating: Optional[float] = 4.5
    violations: Optional[List[str]] = []

    model_config = ConfigDict(from_attributes=True)

class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime
    updated_at: datetime
    products_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
