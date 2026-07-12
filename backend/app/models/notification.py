from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), ForeignKey("employees.id"), nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(String(255), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("Employee")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), ForeignKey("employees.id"))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50)) # Asset, Allocation, Maintenance, etc.
    entity_id = Column(String(50))
    details = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("Employee")
