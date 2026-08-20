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

# -------------------------------------------------------------
# Real RFQ Matching & Datasheet Grounding Schemas
# -------------------------------------------------------------

class QuoteMatchRequest(BaseModel):
    company: Optional[str] = "Premier Manufacturing Corp"
    contactPerson: Optional[str] = "Industrial Client Representative"
    email: Optional[str] = "procurement@premiermfg.com"
    phone: Optional[str] = "+91 22 2540 8899"
    referenceNumber: Optional[str] = "RFQ-2026-004"
    requirementText: str

class ParsedRequirement(BaseModel):
    product: str
    quantity: int
    power: Optional[str] = None
    voltage: Optional[str] = None
    ipRating: Optional[str] = None
    speed: Optional[str] = None
    deliveryDays: int = 7
    destination: Optional[str] = None
    additional_specs: Dict[str, Any] = {}

class SpecificationEvidence(BaseModel):
    parameter: str
    required_value: str
    datasheet_value: str
    source_document: str
    source_page: int
    matched: bool
    difference_note: Optional[str] = None

class SupplierOfferDetail(BaseModel):
    supplierId: Optional[int] = None
    supplierName: str
    productModel: str
    supplierProductCode: str
    priceINR: float
    deliveryDays: int
    stockQuantity: int
    rating: float
    ipRating: str
    isExactMatch: bool
    advantageNotes: Optional[str] = None
    violations: List[str] = []

class QuoteMatchResult(BaseModel):
    success: bool = True
    parsedSpecs: ParsedRequirement
    productMatch: Optional[Dict[str, Any]] = None
    supplierOffer: Optional[SupplierOfferDetail] = None
    alternativeOffers: List[SupplierOfferDetail] = []
    specEvidence: List[SpecificationEvidence] = []
    matchStatus: str # "Exact Match" | "Closest Alternative" | "No Match"
    quoteData: Optional[Dict[str, Any]] = None
    processLogs: List[str] = []
    warnings: List[str] = []

class QuoteSimulateRevisionRequest(BaseModel):
    quoteNumber: Optional[str] = None
    productModel: Optional[str] = None
    supplierName: Optional[str] = None
    originalQuantity: int
    newQuantity: int
    originalDeliveryDays: int
    newDeliveryDays: int
    unitPrice: float = 0.0

class QuoteSimulateRevisionResponse(BaseModel):
    status: str # "valid" | "invalid"
    message: str
    supported: bool
    stockAvailable: int
    minimumLeadDays: int
    revisedSubtotal: float
    revisedTax: float
    revisedFreight: float
    revisedTotal: float
    alternativeOffer: Optional[SupplierOfferDetail] = None
