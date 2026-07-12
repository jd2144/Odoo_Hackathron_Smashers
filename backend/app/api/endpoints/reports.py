from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import datetime

from app.api.deps import get_db, get_current_active_manager_or_admin
from app.models.asset import Asset
from app.models.category import Category
from app.schemas.report import KPIDashboardResponse, DepreciationReportResponse, DepreciationItem

router = APIRouter()

@router.get("/dashboard", response_model=KPIDashboardResponse)
def get_kpi_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_manager_or_admin)
):
    """
    Get top-level KPIs for the asset management dashboard.
    """
    total = db.query(Asset).count()
    available = db.query(Asset).filter(Asset.status == "Available").count()
    allocated = db.query(Asset).filter(Asset.status == "Allocated").count()
    maintenance = db.query(Asset).filter(Asset.status == "Under Maintenance").count()
    lost = db.query(Asset).filter(Asset.status == "Lost").count()

    return KPIDashboardResponse(
        total_assets=total,
        available_assets=available,
        allocated_assets=allocated,
        maintenance_assets=maintenance,
        lost_assets=lost
    )

@router.get("/depreciation", response_model=DepreciationReportResponse)
def get_depreciation_report(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_manager_or_admin)
):
    """
    Calculate straight-line depreciation for all active assets.
    """
    assets = db.query(Asset).join(Category).filter(
        Asset.status.notin_(["Lost", "Decommissioned"])
    ).all()

    items = []
    total_acq = 0.0
    total_curr = 0.0

    current_year = datetime.date.today().year
    current_date = datetime.date.today()

    for asset in assets:
        rate = float(asset.category.depreciation_rate or 0)
        cost = float(asset.acquisition_cost or 0)
        
        if not asset.acquisition_date:
            years_elapsed = 0.0
        else:
            # Simple calculation for years elapsed
            days = (current_date - asset.acquisition_date).days
            years_elapsed = max(0.0, days / 365.25)
        
        # Straight line: Value = Cost - (Cost * rate * years)
        # Cannot be less than 0
        depreciated_amount = cost * (rate / 100.0) * years_elapsed
        current_value = max(0.0, cost - depreciated_amount)

        items.append(DepreciationItem(
            asset_id=asset.id,
            asset_tag=asset.asset_tag,
            name=asset.name,
            acquisition_cost=cost,
            current_value=current_value,
            depreciation_rate=rate,
            years_elapsed=round(years_elapsed, 2)
        ))
        
        total_acq += cost
        total_curr += current_value

    return DepreciationReportResponse(
        items=items,
        total_acquisition_cost=total_acq,
        total_current_value=total_curr
    )
