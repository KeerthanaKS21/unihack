from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
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
    extracted_attributes: Optional[Dict[str, str]] = {}
    source_citations: Optional[List[Dict[str, Any]]] = []
    extracted_text: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[DocumentResponse]
