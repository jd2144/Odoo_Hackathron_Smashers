from sqlalchemy import Column, String, Integer, DECIMAL
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, index=True)
    depreciation_rate = Column(DECIMAL(5, 2))
    total_assets_count = Column(Integer, server_default='0', nullable=False, default=0)
