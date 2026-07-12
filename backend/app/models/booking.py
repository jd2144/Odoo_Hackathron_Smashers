from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class AssetBooking(Base):
    __tablename__ = "asset_bookings"

    id = Column(String(50), primary_key=True, index=True)
    asset_id = Column(String(50), ForeignKey("assets.id"), nullable=False)
    employee_id = Column(String(50), ForeignKey("employees.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default="Approved")  # Pending, Approved, Cancelled
    purpose = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    reminder_sent_at = Column(DateTime(timezone=True), nullable=True)

    asset = relationship("Asset")
    employee = relationship("Employee")

    __table_args__ = (
        Index('ix_booking_asset_dates', 'asset_id', 'start_time', 'end_time'),
    )
