from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AuditCycleCreate(BaseModel):
    name: str
    auditor_ids: Optional[List[str]] = []
    scope_department_id: Optional[str] = None
    scope_category_id: Optional[str] = None
    scope_location: Optional[str] = None

class AuditItemAction(BaseModel):
    status: Optional[str] = "Scanned" # Scanned, Missing, Damaged
    notes: Optional[str] = None

class AuditItemResponse(BaseModel):
    id: str
    audit_cycle_id: str
    asset_id: str
    status: str
    scanned_by_id: Optional[str] = None
    scan_date: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class AuditCycleResponse(BaseModel):
    id: str
    name: str
    initiated_by_id: str
    start_date: datetime
    end_date: Optional[datetime] = None
    status: str
    scope_department_id: Optional[str] = None
    scope_category_id: Optional[str] = None
    scope_location: Optional[str] = None
    items: List[AuditItemResponse] = []

    class Config:
        from_attributes = True
