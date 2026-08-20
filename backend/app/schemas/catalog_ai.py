from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class CatalogAIChatRequest(BaseModel):
    message: str
    conversationId: Optional[str] = None

class CatalogAIChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    confidence: float
    hasConflict: bool
