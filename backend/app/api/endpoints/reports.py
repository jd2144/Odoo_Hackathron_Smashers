from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import datetime
from decimal import Decimal

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
    total_acq = Decimal("0.00")
    total_curr = Decimal("0.00")

    current_year = datetime.date.today().year
    current_date = datetime.date.today()

    for asset in assets:
        rate = Decimal(str(asset.category.depreciation_rate or 0))
        cost = Decimal(str(asset.acquisition_cost or 0))
        
        if not asset.acquisition_date:
            years_elapsed = Decimal("0.00")
        else:
            # Simple calculation for years elapsed
            days = (current_date - asset.acquisition_date).days
            years_elapsed = Decimal(str(max(0.0, days / 365.25)))
        
        # Straight line: Value = Cost - (Cost * rate * years)
        # Cannot be less than 0
        depreciated_amount = cost * (rate / Decimal("100.0")) * years_elapsed
        current_value = max(Decimal("0.00"), cost - depreciated_amount)

        # Round to 2 decimals
        current_value = current_value.quantize(Decimal('0.01'))
        years_elapsed_rounded = years_elapsed.quantize(Decimal('0.01'))

        items.append(DepreciationItem(
            asset_id=asset.id,
            asset_tag=asset.asset_tag,
            name=asset.name,
            acquisition_cost=cost,
            current_value=current_value,
            depreciation_rate=rate,
            years_elapsed=years_elapsed_rounded
        ))
        
        total_acq += cost
        total_curr += current_value

    return DepreciationReportResponse(
        items=items,
        total_acquisition_cost=total_acq,
        total_current_value=total_curr
    )
