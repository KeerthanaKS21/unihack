from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class QuoteItemBase(BaseModel):
    product_id: int
    supplier_id: Optional[int] = None
    product_model: str
    description: Optional[str] = None
    spec_summary: Optional[str] = None
    quantity: int = 1
    unit_price: float
    delivery_days: Optional[int] = 7
    subtotal: float
    supplier_source: Optional[str] = None

class QuoteItemCreate(QuoteItemBase):
    pass

class QuoteItemResponse(QuoteItemBase):
    id: int
    quote_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class QuoteBase(BaseModel):
    quote_number: str
    customer_name: str
    customer_email: Optional[str] = None
    company: Optional[str] = None
    request_prompt: Optional[str] = None
    status: Optional[str] = "Validated"
    version: Optional[str] = "v1.0"
    subtotal: float = 0.0
    tax: float = 0.0
    freight: float = 0.0
    total: float = 0.0
    currency: Optional[str] = "INR"
    delivery_days: Optional[int] = 7
    valid_until: Optional[str] = None
    validation_notes: Optional[List[str]] = []
    history: Optional[List[Dict[str, Any]]] = []

class QuoteCreate(QuoteBase):
    items: Optional[List[QuoteItemCreate]] = []

class QuoteRevisionRequest(BaseModel):
    quantity: Optional[int] = None
    delivery_days: Optional[int] = None
    comments: Optional[str] = None

class QuoteResponse(QuoteBase):
    id: int
    created_at: datetime
    updated_at: datetime
    items: Optional[List[QuoteItemResponse]] = []

    model_config = ConfigDict(from_attributes=True)
