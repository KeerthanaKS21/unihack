from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProductAttributeBase(BaseModel):
    attribute_name: str
    attribute_value: str
    normalized_value: Optional[float] = None
    unit: Optional[str] = None
    source_document_id: Optional[int] = None
    source_page: Optional[int] = None
    confidence: Optional[float] = 1.0
    verification_status: Optional[str] = "VERIFIED"

class ProductAttributeCreate(ProductAttributeBase):
    pass

class ProductAttributeResponse(ProductAttributeBase):
    id: int
    product_version_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProductVersionBase(BaseModel):
    version_number: str
    source_document_id: Optional[int] = None
    effective_date: Optional[datetime] = None
    is_current: Optional[bool] = False
    verified_by: Optional[str] = None
    status: Optional[str] = "VERIFIED"

class ProductVersionCreate(ProductVersionBase):
    attributes: Optional[List[ProductAttributeCreate]] = []

class ProductVersionResponse(ProductVersionBase):
    id: int
    product_id: int
    created_at: datetime
    attributes: Optional[List[ProductAttributeResponse]] = []

    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    product_code: str
    name: str
    manufacturer: str
    category: str
    description: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    image_url: Optional[str] = None
    health_score: Optional[int] = 90

class ProductCreate(ProductBase):
    initial_version: Optional[str] = "v1.0"
    specs: Optional[Dict[str, str]] = {}

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    manufacturer: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    image_url: Optional[str] = None
    health_score: Optional[int] = None
    current_version_id: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    current_version_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    specs: Optional[Dict[str, Any]] = {}
    previous_specs: Optional[Dict[str, Any]] = {}
    current_version: Optional[str] = None
    previous_version: Optional[str] = None
    changes_count: Optional[int] = 0
    pending_impacts_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class ProductListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[ProductResponse]
