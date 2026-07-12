from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import update
from typing import List, Optional
import uuid

from app.api.deps import get_db, get_current_active_user, get_current_active_admin_or_asset_manager
from app.models.asset import Asset
from app.models.category import Category
from app.schemas.asset import AssetCreate, AssetResponse

router = APIRouter()

@router.get("/", response_model=List[AssetResponse])
def get_assets(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user = Depends(get_current_active_user)
):
    """
    Retrieve assets.
    """
    query = db.query(Asset)
    
    if search:
        query = query.filter(Asset.name.ilike(f"%{search}%") | Asset.asset_tag.ilike(f"%{search}%"))
    if category_id:
        query = query.filter(Asset.category_id == category_id)
    if status_filter:
        query = query.filter(Asset.status == status_filter)
        
    assets = query.offset(skip).limit(limit).all()
    return assets

@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    *,
    db: Session = Depends(get_db),
    asset_in: AssetCreate,
    current_user = Depends(get_current_active_admin_or_asset_manager)
):
    """
    Create new asset.
    """
    # Verify category exists
    category = db.query(Category).filter(Category.id == asset_in.category_id).first()
    if not category:
        raise HTTPException(
            status_code=400,
            detail="Category not found"
        )
        
    # Check serial number uniqueness if provided
    if asset_in.serial_number:
        existing = db.query(Asset).filter(Asset.serial_number == asset_in.serial_number).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Asset with this serial number already exists"
            )

    # Generate Asset Tag logic using UUID with a retry loop to prevent collisions
    year = asset_in.acquisition_date.year
    asset_data = asset_in.model_dump()
    
    max_retries = 3
    for attempt in range(max_retries):
        unique_suffix = uuid.uuid4().hex[:6].upper()
        generated_tag = f"AST-{year}-{unique_suffix}"

        db_asset = Asset(
            id=f"ast-{uuid.uuid4().hex[:8]}",
            asset_tag=generated_tag,
            current_value=asset_in.acquisition_cost, # Initially same as acquisition cost
            **asset_data
        )
        
        db.add(db_asset)
        
        # Update category count using an atomic database update
        db.execute(
            update(Category)
            .where(Category.id == asset_in.category_id)
            .values(total_assets_count=Category.total_assets_count + 1)
        )
        
        try:
            # Commit both together in one transaction
            db.commit()
            db.refresh(db_asset)
            return db_asset
        except IntegrityError as e:
            db.rollback()
            error_msg = str(e.orig)
            
            if "serial_number" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Asset with this serial number already exists"
                )
                
            # If it's an asset tag collision, we retry
            if "asset_tag" in error_msg:
                if attempt == max_retries - 1:
                    raise HTTPException(
                        status_code=500,
                        detail="Could not generate a unique asset tag. Please try again."
                    )
                continue  # Go to the next retry
                
            # If it's some other constraint violation
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Database constraint violation occurred."
            )


@router.get("/{id}", response_model=AssetResponse)
def get_asset_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get a specific asset by id.
    """
    asset = db.query(Asset).filter(Asset.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset
