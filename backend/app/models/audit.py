from sqlalchemy import Column, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# Association table for audit cycle auditors
audit_cycle_auditors = Table(
    "audit_cycle_auditors",
    Base.metadata,
    Column("audit_cycle_id", String(50), ForeignKey("audit_cycles.id", ondelete="CASCADE"), primary_key=True),
    Column("employee_id", String(50), ForeignKey("employees.id", ondelete="CASCADE"), primary_key=True)
)

class AuditCycle(Base):
    __tablename__ = "audit_cycles"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    initiated_by_id = Column(String(50), ForeignKey("employees.id"), nullable=False)
    start_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    end_date = Column(DateTime(timezone=True))
    status = Column(String(20), default="In Progress")  # In Progress, Closed

    # Scope fields
    scope_department_id = Column(String(50), ForeignKey("departments.id"), nullable=True)
    scope_category_id = Column(String(50), ForeignKey("categories.id"), nullable=True)
    scope_location = Column(String(100), nullable=True)

    initiated_by = relationship("Employee")
    auditors = relationship("Employee", secondary=audit_cycle_auditors)
    items = relationship("AuditItem", back_populates="audit_cycle", cascade="all, delete-orphan")


class AuditItem(Base):
    __tablename__ = "audit_items"

    id = Column(String(50), primary_key=True, index=True)
    audit_cycle_id = Column(String(50), ForeignKey("audit_cycles.id"), nullable=False)
    asset_id = Column(String(50), ForeignKey("assets.id"), nullable=False)
    
    # Statuses: Pending, Scanned, Missing, Damaged
    # Pending = Expected but not yet scanned
    # Scanned = Successfully found and verified
    # Missing = Explicitly reviewed and marked as missing/lost
    # Damaged = Found but damaged
    status = Column(String(20), default="Pending")
    
    scanned_by_id = Column(String(50), ForeignKey("employees.id"))
    scan_date = Column(DateTime(timezone=True))
    notes = Column(String(255))

    audit_cycle = relationship("AuditCycle", back_populates="items")
    asset = relationship("Asset")
    scanned_by = relationship("Employee")
