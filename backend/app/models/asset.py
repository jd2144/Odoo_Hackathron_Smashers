from sqlalchemy import Column, String, Boolean, DECIMAL, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(50), primary_key=True, index=True)
    asset_tag = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    category_id = Column(String(50), ForeignKey("categories.id"))
    serial_number = Column(String(100), unique=True, index=True)
    acquisition_date = Column(Date, nullable=False)
    acquisition_cost = Column(DECIMAL(12, 2), nullable=False)
    current_value = Column(DECIMAL(12, 2))
    condition = Column(String(30))  # New, Good, Fair, Poor, Broken
    location = Column(String(100), nullable=False)
    status = Column(String(30), default="Available")  # Available, Allocated, Under Maintenance, Reserved, Lost, Retired, Disposed
    shared_bookable = Column(Boolean, default=False)
    qr_code_url = Column(Text)
    
    current_holder_type = Column(String(20))  # Employee, Department, None
    current_holder_id = Column(String(50))    # ID of Employee or Department

    category = relationship("Category")
