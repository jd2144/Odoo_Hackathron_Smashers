from pydantic import BaseModel
from typing import List

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
    acquisition_cost: float
    current_value: float
    depreciation_rate: float
    years_elapsed: float

class DepreciationReportResponse(BaseModel):
    items: List[DepreciationItem]
    total_acquisition_cost: float
    total_current_value: float
