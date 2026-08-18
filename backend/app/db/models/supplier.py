from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    supplier_code = Column(String(100), unique=True, index=True, nullable=False)
    contact_email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    tier = Column(String(100), default="Authorized Partner") # Direct OEM, Authorized Partner, Distributor
    rating = Column(Float, default=4.5)
    status = Column(String(50), default="ACTIVE", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    supplier_products = relationship("SupplierProduct", back_populates="supplier", cascade="all, delete-orphan")

class SupplierProduct(Base):
    __tablename__ = "supplier_products"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    supplier_product_code = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    stock_quantity = Column(Integer, default=0)
    delivery_days = Column(Integer, default=7)
    minimum_order_quantity = Column(Integer, default=1)
    technical_match_score = Column(Float, default=1.0)
    is_exact_match = Column(String(50), default="Exact Match") # Exact Match, Closest Alternative, Not Recommended
    supplier_status = Column(String(50), default="AVAILABLE")
    advantage_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    supplier = relationship("Supplier", back_populates="supplier_products")
    product = relationship("Product", back_populates="supplier_products")
