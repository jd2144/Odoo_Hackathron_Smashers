from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.config import settings
from app.models.user import Employee
from app.schemas.token import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/auth/login")

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> Employee:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except JWTError:
        raise credentials_exception
    
    user = db.query(Employee).filter(Employee.id == token_data.sub).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(
    current_user: Employee = Depends(get_current_user),
) -> Employee:
    if current_user.status != "Active":
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_active_admin(
    current_user: Employee = Depends(get_current_active_user),
) -> Employee:
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="The user doesn't have enough privileges")
    return current_user

def get_current_active_manager_or_admin(
    current_user: Employee = Depends(get_current_active_user),
) -> Employee:
    if current_user.role not in ["Admin", "Asset Manager", "Department Head"]:
        raise HTTPException(status_code=403, detail="The user doesn't have enough privileges")
    return current_user

def get_current_active_admin_or_asset_manager(
    current_user: Employee = Depends(get_current_active_user),
) -> Employee:
    if current_user.role not in ["Admin", "Asset Manager"]:
        raise HTTPException(status_code=403, detail="The user doesn't have enough privileges")
    return current_user
