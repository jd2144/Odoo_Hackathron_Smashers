from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
import secrets
import hashlib
import uuid

from app.core.database import SessionLocal
from app.api.deps import get_db, get_current_active_user
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import Employee, PasswordResetToken
from app.schemas.token import Token
from app.schemas.user import EmployeeResponse, UserSignup, ForgotPasswordRequest, ResetPasswordRequest

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

@router.post("/signup", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def signup(
    user_in: UserSignup,
    db: Session = Depends(get_db)
):
    """
    Register a new employee.
    """
    user = db.query(Employee).filter(Employee.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )

    new_user = Employee(
        id=f"emp-{uuid.uuid4().hex[:8]}",
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role="Employee",
        department_id=user_in.department_id,
        status="Active"
    )

    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
        return new_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    req: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a password reset token.
    """
    user = db.query(Employee).filter(Employee.email == req.email).first()
    if not user:
        # Return success even if user doesn't exist to prevent email enumeration
        return {"success": True, "message": "If an account with that email exists, a password reset link has been generated."}

    # Generate one-time token
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    
    reset_record = PasswordResetToken(
        id=f"prt-{uuid.uuid4().hex[:8]}",
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
    )
    
    db.add(reset_record)
    try:
        db.commit()
        # In a real app, send email here. For MVP, print to console.
        print(f"DEBUG: Password reset token for {user.email}: {raw_token}")
        return {"success": True, "message": "If an account with that email exists, a password reset link has been generated."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    req: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password using a token.
    """
    token_hash = hashlib.sha256(req.token.encode()).hexdigest()
    
    reset_record = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    if reset_record.expires_at < datetime.now(timezone.utc):
        db.delete(reset_record)
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    user = db.query(Employee).filter(Employee.id == reset_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.password_hash = get_password_hash(req.new_password)
    db.delete(reset_record)
    
    try:
        db.commit()
        return {"success": True, "message": "Password successfully reset"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")
