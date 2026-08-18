from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Change(Base):
    __tablename__ = "changes"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    old_version_id = Column(Integer, ForeignKey("product_versions.id", ondelete="SET NULL"), nullable=True)
    new_version_id = Column(Integer, ForeignKey("product_versions.id", ondelete="SET NULL"), nullable=True)
    attribute_name = Column(String(100), nullable=False) # e.g. "Rated Power", "Rated Speed", "Weight"
    old_value = Column(String(255), nullable=True)       # e.g. "5.5 kW"
    new_value = Column(String(255), nullable=False)      # e.g. "7.5 kW"
    change_type = Column(String(50), default="MODIFIED") # ADDED, REMOVED, MODIFIED, UNCHANGED
    source_document = Column(String(255), nullable=True)
    confidence = Column(Float, default=0.98)
    status = Column(String(50), default="PENDING", index=True) # PENDING, APPROVED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="changes", foreign_keys=[product_id])
    impacts = relationship("ChangeImpact", back_populates="change", cascade="all, delete-orphan")

class ChangeImpact(Base):
    __tablename__ = "change_impacts"

    id = Column(Integer, primary_key=True, index=True)
    change_id = Column(Integer, ForeignKey("changes.id", ondelete="CASCADE"), nullable=False, index=True)
    impact_type = Column(String(50), index=True, nullable=False) # Compatibility, E-commerce, Procurement, Quote, Recommendations
    affected_entity_type = Column(String(100), nullable=True)   # Controller, Storefront SKU, Supplier Matrix, Quote Template
    affected_entity_id = Column(String(100), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    context_evidence = Column(Text, nullable=True)
    severity = Column(String(50), default="medium", index=True) # critical, high, medium, low
    reviewed = Column(Boolean, default=False, index=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String(150), nullable=True)
    target_module_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    change = relationship("Change", back_populates="impacts")
