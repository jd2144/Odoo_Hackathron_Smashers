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

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    department_id: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
