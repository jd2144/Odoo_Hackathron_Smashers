from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(String(50), primary_key=True, index=True)
    asset_id = Column(String(50), ForeignKey("assets.id"), nullable=False)
    requested_by_id = Column(String(50), ForeignKey("employees.id"), nullable=False)
    approved_by_id = Column(String(50), ForeignKey("employees.id"))
    assigned_to_id = Column(String(50), ForeignKey("employees.id"))
    
    status = Column(String(30), default="Pending") # Pending, Approved, Assigned, In Progress, Resolved
    issue_description = Column(String(500), nullable=False)
    resolution_notes = Column(String(500))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    asset = relationship("Asset")
    requested_by = relationship("Employee", foreign_keys=[requested_by_id])
    approved_by = relationship("Employee", foreign_keys=[approved_by_id])
    assigned_to = relationship("Employee", foreign_keys=[assigned_to_id])
