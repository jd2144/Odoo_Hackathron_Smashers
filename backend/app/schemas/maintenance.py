from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MaintenanceCreate(BaseModel):
    asset_id: str
    issue_description: str

class MaintenanceUpdate(BaseModel):
    status: str # Approved, Assigned, In Progress, Resolved
    assigned_to_id: Optional[str] = None
    resolution_notes: Optional[str] = None

class MaintenanceResponse(BaseModel):
    id: str
    asset_id: str
    requested_by_id: str
    approved_by_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    status: str
    issue_description: str
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
