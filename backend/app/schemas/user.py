from pydantic import BaseModel, EmailStr
from typing import Optional

class EmployeeBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "Employee"
    department_id: Optional[str] = None
    status: str = "Active"

class EmployeeCreate(EmployeeBase):
    password: str

class EmployeeResponse(EmployeeBase):
    id: str

    class Config:
        from_attributes = True
