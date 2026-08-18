from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class CatalogIssue(Base):
    __tablename__ = "catalog_issues"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    issue_type = Column(String(50), index=True, nullable=False) # conflict, missing, duplicate, invalid_unit, wrong_category, outdated, compliance, broken_relationship, image_mismatch
    attribute_name = Column(String(100), nullable=True)        # e.g. "Rated Voltage", "Efficiency"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)                      # list of source objects {sourceName, value, priority, confidence}
    ai_recommendation = Column(JSON, nullable=True)            # {suggestedValue, reasoning, confidence, standardReference}
    evidence = Column(Text, nullable=True)
    severity = Column(String(50), default="medium", index=True) # critical, high, medium, low
    status = Column(String(50), default="open", index=True)     # open, in_review, resolved, rejected
    resolution_value = Column(String(255), nullable=True)
    resolved_by = Column(String(150), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="catalog_issues")
