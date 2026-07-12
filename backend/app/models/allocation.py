from sqlalchemy import Column, String, DateTime, ForeignKey, Index, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class AssetAllocation(Base):
    __tablename__ = "asset_allocations"

    id = Column(String(50), primary_key=True, index=True)
    asset_id = Column(String(50), ForeignKey("assets.id"), nullable=False)
    employee_id = Column(String(50), ForeignKey("employees.id"), nullable=True)
    department_id = Column(String(50), ForeignKey("departments.id"), nullable=True)
    allocated_by_id = Column(String(50), ForeignKey("employees.id"), nullable=False)
    allocation_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expected_return_date = Column(DateTime(timezone=True), nullable=True)
    overdue_notified_at = Column(DateTime(timezone=True), nullable=True)
    return_date = Column(DateTime(timezone=True))
    status = Column(String(20), default="Active")  # Active, Returned, Transferred
    notes = Column(String(255))

    asset = relationship("Asset")
    employee = relationship("Employee", foreign_keys=[employee_id])
    department = relationship("Department")
    allocated_by = relationship("Employee", foreign_keys=[allocated_by_id])

    __table_args__ = (
        # Partial unique index ensuring only ONE active allocation per asset
        Index(
            'uix_active_allocation_per_asset', 
            'asset_id', 
            unique=True, 
            postgresql_where=(status == 'Active'),
            sqlite_where=(status == 'Active')
        ),
        # XOR Check Constraint: Must allocate to exactly one destination (employee OR department)
        CheckConstraint(
            "(employee_id IS NOT NULL AND department_id IS NULL) OR (employee_id IS NULL AND department_id IS NOT NULL)",
            name="chk_employee_xor_department"
        ),
    )

class AssetTransfer(Base):
    __tablename__ = "asset_transfers"

    id = Column(String(50), primary_key=True, index=True)
    asset_id = Column(String(50), ForeignKey("assets.id"), nullable=False)
    from_employee_id = Column(String(50), ForeignKey("employees.id"), nullable=False)
    to_employee_id = Column(String(50), ForeignKey("employees.id"), nullable=False)
    requested_by_id = Column(String(50), ForeignKey("employees.id"), nullable=False)
    approved_by_id = Column(String(50), ForeignKey("employees.id"))
    request_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decision_date = Column(DateTime(timezone=True))
    status = Column(String(20), default="Pending")  # Pending, Approved, Rejected
    reason = Column(String(255))

    asset = relationship("Asset")
    from_employee = relationship("Employee", foreign_keys=[from_employee_id])
    to_employee = relationship("Employee", foreign_keys=[to_employee_id])
    requested_by = relationship("Employee", foreign_keys=[requested_by_id])
    approved_by = relationship("Employee", foreign_keys=[approved_by_id])
