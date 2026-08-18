from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.db.database import Base

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), index=True, nullable=False) # PRODUCT_VERSION, SYNCHRONIZATION, ECOMMERCE_UPDATE, CHANGE_IMPACT, CATALOG_ISSUE, QUOTE
    entity_id = Column(String(100), index=True, nullable=False)
    action = Column(String(50), nullable=False)                 # SYNC_APPROVAL, ECOMMERCE_APPROVAL, IMPACT_REVIEW, CATALOG_CORRECTION, COMPLIANCE_APPROVAL, QUOTE_APPROVAL
    status = Column(String(50), default="APPROVED")             # APPROVED, REJECTED, PENDING
    comments = Column(Text, nullable=True)
    approved_by = Column(String(150), default="Engineering Lead")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
