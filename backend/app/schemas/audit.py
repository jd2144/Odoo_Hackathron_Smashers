from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AuditCycleCreate(BaseModel):
    name: str

class AuditItemAction(BaseModel):
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
    items: List[AuditItemResponse] = []

    class Config:
        from_attributes = True
