from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import uuid

from app.api.deps import get_db, get_current_active_user, get_current_active_admin, get_current_active_manager_or_admin
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentResponse

router = APIRouter()

@router.get("/", response_model=List[DepartmentResponse])
def get_departments(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_active_user)
):
    """
    Retrieve departments.
    """
    departments = db.query(Department).offset(skip).limit(limit).all()
    return departments

@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    *,
    db: Session = Depends(get_db),
    department_in: DepartmentCreate,
    current_user = Depends(get_current_active_admin)
):
    """
    Create new department.
    """
    if department_in.cost_center:
        existing = db.query(Department).filter(Department.cost_center == department_in.cost_center).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Department with this cost center already exists"
            )

    department_data = department_in.model_dump()
    db_department = Department(
        id=f"dept-{uuid.uuid4().hex[:8]}",
        **department_data
    )
    
    db.add(db_department)
    try:
        db.commit()
        db.refresh(db_department)
        return db_department
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department with this cost center already exists"
        )
