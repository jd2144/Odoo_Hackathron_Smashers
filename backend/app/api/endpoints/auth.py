from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import SessionLocal
from app.api.deps import get_db, get_current_active_user
from app.core.security import verify_password, create_access_token
from app.models.user import Employee
from app.schemas.token import Token
from app.schemas.user import EmployeeResponse

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(Employee).filter(Employee.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif user.status != "Active":
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token = create_access_token(subject=user.id)
    return {
        "success": True,
        "token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "departmentId": user.department_id
        }
    }

@router.get("/me", response_model=EmployeeResponse)
def get_current_user_profile(
    current_user: Employee = Depends(get_current_active_user)
):
    """
    Get current user profile
    """
    return current_user
