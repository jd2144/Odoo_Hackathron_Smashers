from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), default="Employee")  # Admin, Asset Manager, Department Head, Employee
    department_id = Column(String(50), ForeignKey("departments.id"), nullable=True)
    status = Column(String(20), default="Active")  # Active, Deactivated

    department = relationship("Department")
