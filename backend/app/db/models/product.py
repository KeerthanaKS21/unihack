from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    manufacturer = Column(String(255), index=True, nullable=False)
    category = Column(String(150), index=True, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE", index=True, nullable=False)  # ACTIVE, REVIEW_REQUIRED, SYNCHRONIZED, CONFLICT
    current_version_id = Column(Integer, nullable=True)
    image_url = Column(String(500), nullable=True)
    health_score = Column(Integer, default=90)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    versions = relationship("ProductVersion", back_populates="product", foreign_keys="[ProductVersion.product_id]", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="product")
    supplier_products = relationship("SupplierProduct", back_populates="product")
    certificates = relationship("Certificate", back_populates="product")
    changes = relationship("Change", back_populates="product", foreign_keys="[Change.product_id]")
    catalog_issues = relationship("CatalogIssue", back_populates="product")

class ProductVersion(Base):
    __tablename__ = "product_versions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(String(50), nullable=False)  # e.g. "v1.4", "v2.0"
    source_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    effective_date = Column(DateTime, default=datetime.utcnow)
    is_current = Column(Boolean, default=False, index=True)
    verified_by = Column(String(150), nullable=True)
    status = Column(String(50), default="VERIFIED")  # VERIFIED, SUPERSEDED, DRAFT
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="versions", foreign_keys=[product_id])
    attributes = relationship("ProductAttribute", back_populates="product_version", cascade="all, delete-orphan")
    source_document = relationship("Document", foreign_keys=[source_document_id])

class ProductAttribute(Base):
    __tablename__ = "product_attributes"

    id = Column(Integer, primary_key=True, index=True)
    product_version_id = Column(Integer, ForeignKey("product_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    attribute_name = Column(String(100), index=True, nullable=False)  # e.g. "Power", "Voltage", "Speed"
    attribute_value = Column(String(255), nullable=False)            # e.g. "7.5 kW"
    normalized_value = Column(Float, nullable=True)                  # e.g. 7.5
    unit = Column(String(50), nullable=True)                         # e.g. "kW", "V", "RPM"
    source_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    source_page = Column(Integer, nullable=True)
    confidence = Column(Float, default=1.0)
    verification_status = Column(String(50), default="VERIFIED")     # VERIFIED, UNVERIFIED, CONFLICT
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    product_version = relationship("ProductVersion", back_populates="attributes")
    source_document = relationship("Document", foreign_keys=[source_document_id])
