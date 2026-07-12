from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AllocationCreate(BaseModel):
    employee_id: str
    notes: Optional[str] = None

class AllocationReturn(BaseModel):
    notes: Optional[str] = None

class AllocationResponse(BaseModel):
    id: str
    asset_id: str
    employee_id: str
    allocated_by_id: str
    allocation_date: datetime
    return_date: Optional[datetime] = None
    status: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class TransferCreate(BaseModel):
    to_employee_id: str
    reason: Optional[str] = None

class TransferDecision(BaseModel):
    status: str  # Approved, Rejected

class TransferResponse(BaseModel):
    id: str
    asset_id: str
    from_employee_id: str
    to_employee_id: str
    requested_by_id: str
    approved_by_id: Optional[str] = None
    request_date: datetime
    decision_date: Optional[datetime] = None
    status: str
    reason: Optional[str] = None

    class Config:
        from_attributes = True
