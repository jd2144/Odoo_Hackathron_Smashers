from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal

class AssetBase(BaseModel):
    name: str
    category_id: str
    serial_number: Optional[str] = None
    acquisition_date: date
    acquisition_cost: Decimal
    condition: Optional[str] = "New"
    location: str
    shared_bookable: bool = False

class AssetCreate(AssetBase):
    pass

class AssetResponse(AssetBase):
    id: str
    asset_tag: str
    current_value: Optional[Decimal] = None
    status: str
    qr_code_url: Optional[str] = None
    current_holder_type: Optional[str] = None
    current_holder_id: Optional[str] = None

    class Config:
        from_attributes = True
