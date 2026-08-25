from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from typing import Generator
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Configure engine based on driver
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        echo=False
    )
else:
    # PostgreSQL configuration
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

_tables_initialized = False

def init_db():
    global _tables_initialized
    if not _tables_initialized:
        try:
            import app.db.models  # noqa: F401 - Register all models with Base.metadata
            Base.metadata.create_all(bind=engine)
            _tables_initialized = True
        except Exception as e:
            logger.warning(f"Database table initialization warning: {e}")

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for yielding database session with automatic cleanup and rollback on exception.
    """
    init_db()
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database session exception: {e}")
        raise
    finally:
        db.close()
