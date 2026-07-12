from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class AuditCycle(Base):
    __tablename__ = "audit_cycles"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    initiated_by_id = Column(String(50), ForeignKey("employees.id"), nullable=False)
    start_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    end_date = Column(DateTime(timezone=True))
    status = Column(String(20), default="In Progress")  # In Progress, Closed

    initiated_by = relationship("Employee")
    items = relationship("AuditItem", back_populates="audit_cycle", cascade="all, delete-orphan")


class AuditItem(Base):
    __tablename__ = "audit_items"

    id = Column(String(50), primary_key=True, index=True)
    audit_cycle_id = Column(String(50), ForeignKey("audit_cycles.id"), nullable=False)
    asset_id = Column(String(50), ForeignKey("assets.id"), nullable=False)
    
    # Statuses: Pending, Scanned, Missing
    # Pending = Expected but not yet scanned
    # Scanned = Successfully found and verified
    # Missing = Explicitly reviewed and marked as missing/lost
    status = Column(String(20), default="Pending")
    
    scanned_by_id = Column(String(50), ForeignKey("employees.id"))
    scan_date = Column(DateTime(timezone=True))
    notes = Column(String(255))

    audit_cycle = relationship("AuditCycle", back_populates="items")
    asset = relationship("Asset")
    scanned_by = relationship("Employee")
