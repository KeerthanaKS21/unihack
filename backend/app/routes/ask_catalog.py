from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.db.database import get_db
from app.services.ask_catalog_service import AskCatalogService

router = APIRouter(prefix="/ask-catalog", tags=["Ask Catalog AI"])

class AskRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None

class SourceCitation(BaseModel):
    docName: str
    page: int
    snippet: str
    verified: bool = True

class ActionCard(BaseModel):
    title: str
    label: str
    url: str

class ComparisonTable(BaseModel):
    headers: List[str]
    rows: List[List[str]]

class AskResponse(BaseModel):
    text: str
    confidence: float
    sourceCitations: Optional[List[SourceCitation]] = None
    actionCard: Optional[ActionCard] = None
    comparisonTable: Optional[ComparisonTable] = None
    isMissingDataDemonstration: bool = False

@router.post("", response_model=AskResponse)
def ask_catalog(request: AskRequest, db: Session = Depends(get_db)):
    """
    Process a natural language query against the product catalog and document knowledge base.
    """
    return AskCatalogService.process_query(db, request.query, request.context)
