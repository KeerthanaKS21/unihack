from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

class DocumentBase(BaseModel):
    original_file_name: str
    document_type: Optional[str] = "DATASHEET"
    product_id: Optional[int] = None
    uploaded_by: Optional[str] = "System / Engineering Lead"

class DocumentUploadResponse(BaseModel):
    id: int
    file_name: str
    original_file_name: str
    document_type: str
    file_size: int
    file_size_formatted: Optional[str] = None
    processing_status: str
    product_id: Optional[int] = None
    product_model: Optional[str] = None
    match_confidence: Optional[float] = 1.0
    is_same_product_detected: Optional[bool] = True
    uploaded_at: datetime
    message: str = "Document uploaded successfully"
    is_ambiguous: Optional[bool] = False
    possible_matches: Optional[List[Dict[str, Any]]] = []

    model_config = ConfigDict(from_attributes=True)

class ProductIdentity(BaseModel):
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    product_name: Optional[str] = None
    product_type: Optional[str] = None
    category: Optional[str] = None

class ProductSpecificationItem(BaseModel):
    attribute_name: str
    value: Optional[Union[float, int, str, bool]] = None
    unit: Optional[str] = None
    raw_value: Optional[str] = None
    source_text: Optional[str] = None
    source: Optional[Dict[str, Any]] = None
    model_confidence: Optional[float] = None

class ProductExtractionResponse(BaseModel):
    document_id: int
    product: ProductIdentity
    specifications: List[ProductSpecificationItem]
    extracted_at: Optional[datetime] = None
    source_format: Optional[str] = None
    message: Optional[str] = "Product intelligence extracted successfully"

    model_config = ConfigDict(from_attributes=True)

class DocumentResponse(BaseModel):
    id: int
    file_name: str
    original_file_name: str
    file_path: str
    document_type: str
    file_size: int
    file_size_formatted: Optional[str] = None
    mime_type: str
    content_hash: str
    product_id: Optional[int] = None
    product_model: Optional[str] = None
    uploaded_by: str
    uploaded_at: datetime
    processing_status: str
    version_detected: Optional[str] = None
    match_confidence: Optional[float] = 1.0
    pages_count: Optional[int] = 1
    extracted_summary: Optional[str] = None
    extracted_attributes: Optional[Dict[str, Any]] = {}
    source_citations: Optional[List[Dict[str, Any]]] = []
    extracted_text: Optional[str] = None
    extracted_product_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    is_ambiguous: Optional[bool] = False
    possible_matches: Optional[List[Dict[str, Any]]] = []

    model_config = ConfigDict(from_attributes=True)

class DocumentListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[DocumentResponse]

