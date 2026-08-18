from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from datetime import datetime
from app.db.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), index=True, nullable=False) # PRODUCT, DOCUMENT, CHANGE, ISSUE, QUOTE, CERTIFICATE
    entity_id = Column(String(100), index=True, nullable=False)
    action = Column(String(50), index=True, nullable=False)       # CREATE, UPDATE, DELETE, RESOLVE, APPROVE, REJECT
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    performed_by = Column(String(150), default="System")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
