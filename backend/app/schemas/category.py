from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

class CategoryBase(BaseModel):
    name: str
    code: str
    depreciation_rate: Optional[Decimal] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: str
    total_assets_count: int

    class Config:
        from_attributes = True
