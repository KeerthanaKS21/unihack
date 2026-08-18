from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)          # sanitized server-side filename
    original_file_name = Column(String(255), nullable=False) # original uploaded name
    file_path = Column(String(500), nullable=False)          # storage path under uploads/
    document_type = Column(String(50), default="DATASHEET", index=True)  # DATASHEET, CERTIFICATE, MANUAL, CATALOG, SUPPLIER_FILE, IMAGE, OTHER
    file_size = Column(Integer, nullable=False)              # size in bytes
    file_size_formatted = Column(String(50), nullable=True)  # e.g. "4.8 MB"
    mime_type = Column(String(100), nullable=False)          # e.g. "application/pdf"
    content_hash = Column(String(64), index=True, nullable=False) # SHA-256 hash to prevent duplicate uploads
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    uploaded_by = Column(String(150), default="System / Engineering Lead")
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processing_status = Column(String(50), default="UPLOADED", index=True) # UPLOADED, PROCESSING, PROCESSED, FAILED, REVIEW_REQUIRED
    version_detected = Column(String(50), nullable=True)
    match_confidence = Column(Float, default=1.0)
    pages_count = Column(Integer, default=1)
    extracted_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="documents")
    certificates = relationship("Certificate", back_populates="document")
