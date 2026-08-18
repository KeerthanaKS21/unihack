from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    certificate_number = Column(String(100), index=True, nullable=False)
    standard = Column(String(255), index=True, nullable=False) # e.g. "IEC 60034-1", "ATEX Directive 2014/34/EU", "RoHS 3"
    issue_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True, index=True)
    status = Column(String(50), default="VALID", index=True) # VALID, EXPIRING, EXPIRED, MISSING, REVIEW_REQUIRED
    verification_status = Column(String(50), default="Compliant") # Compliant, Non-Compliant, Action Required, Under Review
    ai_confidence = Column(Float, default=0.98)
    ai_recommendation = Column(Text, nullable=True)
    issue_description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="certificates")
    document = relationship("Document", back_populates="certificates")
