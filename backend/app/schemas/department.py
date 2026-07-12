from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DepartmentBase(BaseModel):
    name: str
    cost_center: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
