import logging
from typing import List
from openai import OpenAI
from app.core.config import settings

logger = logging.getLogger("product_intelligence")

class EmbeddingService:
    @staticmethod
    def get_embedding(text: str) -> List[float]:
        """
        Generates embedding vector for a given text.
        If the OpenAI API key is missing or an error occurs, returns an empty list.
        """
        api_key = settings.OPENAI_API_KEY
        if not api_key:
            logger.warning("OPENAI_API_KEY is not configured. Returning empty embedding.")
            return []
            
        try:
            client = OpenAI(api_key=api_key)
            response = client.embeddings.create(
                input=[text],
                model=settings.OPENAI_EMBEDDING_MODEL
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return []
