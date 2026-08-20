from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.catalog_ai import CatalogAIChatRequest, CatalogAIChatResponse
from app.services.catalog_ai_service import CatalogAIService

router = APIRouter(prefix="/catalog-ai", tags=["Catalog AI"])

@router.post("/chat", response_model=CatalogAIChatResponse, summary="Chat with Catalog AI")
def chat_with_catalog_ai(request: CatalogAIChatRequest, db: Session = Depends(get_db)):
    """
    Query the product catalog using a RAG architecture with grounded citations and conflict warnings.
    """
    try:
        response = CatalogAIService.chat(
            db=db,
            message=request.message,
            conversation_id=request.conversationId
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the chat request: {str(e)}"
        )
