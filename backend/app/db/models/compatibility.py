from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Compatibility(Base):
    __tablename__ = "compatibility"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    compatible_product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type = Column(String(50), default="COMPATIBLE_WITH") # COMPATIBLE_WITH, REQUIRES, ALTERNATIVE_TO, INCOMPATIBLE
    status = Column(String(50), default="Compatible", index=True) # Compatible, Incompatible, Warning
    compatibility_score = Column(Float, default=1.0)
    explanation = Column(Text, nullable=True)
    affected_by_recent_change = Column(Boolean, default=False)
    evidence_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    confidence = Column(Float, default=0.95)
    verification_status = Column(String(50), default="VERIFIED")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", foreign_keys=[product_id])
    compatible_product = relationship("Product", foreign_keys=[compatible_product_id])
    evidence_document = relationship("Document", foreign_keys=[evidence_document_id])
