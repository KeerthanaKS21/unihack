import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

# Base directory for backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "AI-Powered Product Intelligence Backend"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./product_intelligence.db"
    
    # File Storage
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "png", "jpg", "jpeg", "xlsx", "xls", "csv", "docx"]

    # OpenAI / LLM Configuration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    
    # LLM Settings (Optional API integration)
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    LLM_PROVIDER: str = "auto"
    LLM_MODEL: str = "gpt-4o-mini"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # OpenAI Config
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"
    
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_database_url(self) -> str:
        # Check environment variables for remote production database
        env_db = (
            os.environ.get("POSTGRES_URL") or 
            os.environ.get("DATABASE_URL") or 
            os.environ.get("VERCEL_POSTGRES_URL") or
            os.environ.get("NEON_DATABASE_URL") or
            os.environ.get("SUPABASE_DATABASE_URL")
        )
        if env_db:
            if env_db.startswith("postgres://"):
                env_db = env_db.replace("postgres://", "postgresql://", 1)
            return env_db

        # If running on Vercel Serverless environment without remote DB, use /tmp for SQLite database
        if os.environ.get("VERCEL") or "AWS_LAMBDA_FUNCTION_NAME" in os.environ:
            return "sqlite:////tmp/product_intelligence.db"

        if self.DATABASE_URL.startswith("sqlite:///") and not self.DATABASE_URL.startswith("sqlite:////"):
            rel_path = self.DATABASE_URL.replace("sqlite:///", "").lstrip("./")
            abs_path = (BASE_DIR / rel_path).resolve().as_posix()
            return f"sqlite:///{abs_path}"
        return self.DATABASE_URL

settings = Settings()
settings.DATABASE_URL = settings.get_database_url()

# On Vercel serverless functions, write uploads to /tmp/uploads
if os.environ.get("VERCEL") or "AWS_LAMBDA_FUNCTION_NAME" in os.environ:
    settings.UPLOAD_DIR = "/tmp/uploads"

# Safe creation of uploads directory (prevents crash on read-only environments)
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
except Exception:
    pass
