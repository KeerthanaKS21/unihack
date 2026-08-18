from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import logging
from app.core.config import settings
from app.db.database import engine, Base
from app.routes import api_router

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("product_intelligence")

# Ensure database tables exist at startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VeriSpec AI | Industrial Product Intelligence Platform",
    description=(
        "Backend REST API for AI-Powered Product Intelligence for Industrial Commerce.\n\n"
        "Features:\n"
        "- Document Upload & Multi-Format Storage\n"
        "- Product & Historical Version Specification Management\n"
        "- Specification Change Detection & Multi-Domain Impact Review\n"
        "- Real-time Catalog Health Metrics & 1-Click Issue Resolution\n"
        "- Procurement Supplier Matrix & Parametric Sourcing\n"
        "- Compliance & Standard Auditing (CE, RoHS, ATEX)\n"
        "- Technical Drivetrain Compatibility Verification\n"
        "- Industrial Quote Automation & Revision Lifecycle\n"
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads folder for static asset retrieval
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Core API Router
app.include_router(api_router)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database": settings.DATABASE_URL.split("://")[0]
    }

@app.get("/", tags=["Health"])
def root():
    return {
        "message": "AI-Powered Product Intelligence Backend API is active.",
        "documentation": "/docs",
        "health": "/health"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected server error occurred. Check backend logs for details."}
    )
