from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    quote_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    request_prompt = Column(Text, nullable=True)
    status = Column(String(50), default="Validated", index=True) # Draft, Validated, Approved, Rejected, Revised
    version = Column(String(20), default="v1.0")
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    freight = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    currency = Column(String(10), default="INR")
    delivery_days = Column(Integer, default=7)
    valid_until = Column(String(100), nullable=True)
    validation_notes = Column(JSON, nullable=True)
    history = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    items = relationship("QuoteItem", back_populates="quote", cascade="all, delete-orphan")

class QuoteItem(Base):
    __tablename__ = "quote_items"

    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    product_model = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    spec_summary = Column(String(255), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, nullable=False)
    delivery_days = Column(Integer, default=7)
    subtotal = Column(Float, nullable=False)
    supplier_source = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    quote = relationship("Quote", back_populates="items")
    product = relationship("Product")
    supplier = relationship("Supplier")
