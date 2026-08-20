from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    certificate_number = Column(String(100), index=True, nullable=False)
    certificate_type = Column(String(100), default="Safety Certificate") # Safety Certificate, Quality Certificate, Hazardous ATEX, Environmental RoHS, CE Declaration
    standard = Column(String(255), index=True, nullable=False) # e.g. "IEC 60034-1", "ATEX Directive 2014/34/EU", "RoHS 3"
    certification_body = Column(String(255), nullable=True) # e.g. "TÜV Rheinland", "SGS Global", "DNV GL"
    scope = Column(Text, nullable=True)
    issue_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True, index=True)
    status = Column(String(50), default="VALID", index=True) # VALID, EXPIRING, EXPIRED, MISSING, REVIEW_REQUIRED
    verification_status = Column(String(50), default="Compliant") # Compliant, Needs Review, Non-Compliant, Expired
    ai_confidence = Column(Float, default=0.98)
    ai_recommendation = Column(Text, nullable=True)
    issue_description = Column(Text, nullable=True)
    conflict_details = Column(JSON, nullable=True) # { "field": "IP Rating", "db_value": "IP55", "certificate_value": "IP65", "source_document": "IEC_Cert_v2.pdf" }
    replacement_candidate_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="certificates")
    document = relationship("Document", foreign_keys=[document_id], back_populates="certificates")
    replacement_candidate = relationship("Document", foreign_keys=[replacement_candidate_id])
