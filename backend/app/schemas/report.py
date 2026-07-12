from pydantic import BaseModel, field_serializer
from typing import List
from decimal import Decimal

class KPIDashboardResponse(BaseModel):
    total_assets: int
    available_assets: int
    allocated_assets: int
    maintenance_assets: int
    lost_assets: int

class DepreciationItem(BaseModel):
    asset_id: str
    asset_tag: str
    name: str
    acquisition_cost: Decimal
    current_value: Decimal
    depreciation_rate: Decimal
    years_elapsed: Decimal

    @field_serializer("acquisition_cost", "current_value", "depreciation_rate", "years_elapsed")
    def serialize_decimal(self, value: Decimal) -> float:
        """Keep exact Decimal arithmetic internally while returning JSON numbers."""
        return float(value)

class DepreciationReportResponse(BaseModel):
    items: List[DepreciationItem]
    total_acquisition_cost: Decimal
    total_current_value: Decimal

    @field_serializer("total_acquisition_cost", "total_current_value")
    def serialize_decimal(self, value: Decimal) -> float:
        return float(value)
