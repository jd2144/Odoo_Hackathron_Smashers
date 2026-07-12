from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import datetime
from decimal import Decimal

from fastapi.responses import StreamingResponse
import io
import csv

from app.api.deps import get_db, get_current_active_manager_or_admin
from app.models.asset import Asset
from app.models.category import Category
from app.models.allocation import AssetAllocation
from app.models.department import Department
from app.models.user import Employee
from app.models.maintenance import MaintenanceRecord
from app.models.booking import AssetBooking
from app.schemas.report import (
    KPIDashboardResponse, DepreciationReportResponse, DepreciationItem,
    DepartmentAllocationSummary, MaintenanceFrequencyItem, BookingUtilizationItem
)

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
        Asset.status.notin_(["Lost", "Retired", "Disposed"])
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

@router.get("/export/assets")
def export_assets_csv(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_manager_or_admin)
):
    """
    Export the complete asset registry to a CSV file.
    """
    assets = db.query(Asset).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Asset ID", "Asset Tag", "Name", "Category ID", "Model", 
        "Serial Number", "Status", "Condition", "Location", "Acquisition Cost", "Acquisition Date"
    ])
    
    for asset in assets:
        writer.writerow([
            asset.id, asset.asset_tag, asset.name, asset.category_id, asset.model,
            asset.serial_number, asset.status, asset.condition, asset.location,
            float(asset.acquisition_cost) if asset.acquisition_cost else 0.0,
            asset.acquisition_date.strftime('%Y-%m-%d') if asset.acquisition_date else ""
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=assets_export.csv"}
    )

@router.get("/allocations/summary", response_model=List[DepartmentAllocationSummary])
def get_department_allocations_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_manager_or_admin)
):
    """
    Get active asset allocation counts grouped by Department.
    """
    # Query direct department allocations
    dept_allocs = db.query(
        Department.name,
        func.count(AssetAllocation.id)
    ).join(
        AssetAllocation, AssetAllocation.department_id == Department.id
    ).filter(
        AssetAllocation.status == "Active"
    ).group_by(Department.name).all()

    # Query employee department allocations
    emp_allocs = db.query(
        Department.name,
        func.count(AssetAllocation.id)
    ).join(
        Employee, AssetAllocation.employee_id == Employee.id
    ).join(
        Department, Employee.department_id == Department.id
    ).filter(
        AssetAllocation.status == "Active"
    ).group_by(Department.name).all()

    # Merge results
    summary_map = {}
    for dept_name, count in dept_allocs + emp_allocs:
        summary_map[dept_name] = summary_map.get(dept_name, 0) + count

    return [
        DepartmentAllocationSummary(department_name=name, active_allocations_count=count)
        for name, count in summary_map.items()
    ]

@router.get("/maintenance/frequency", response_model=List[MaintenanceFrequencyItem])
def get_maintenance_frequency(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_manager_or_admin)
):
    """
    Get maintenance ticket counts grouped by Asset Category.
    """
    frequency = db.query(
        Category.name,
        func.count(MaintenanceRecord.id)
    ).join(
        Asset, MaintenanceRecord.asset_id == Asset.id
    ).join(
        Category, Asset.category_id == Category.id
    ).group_by(Category.name).all()

    return [
        MaintenanceFrequencyItem(category_name=name, tickets_count=count)
        for name, count in frequency
    ]

@router.get("/bookings/utilization", response_model=List[BookingUtilizationItem])
def get_booking_utilization(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_manager_or_admin)
):
    """
    Get booking utilization rate for assets in the last 30 days.
    """
    now = datetime.datetime.utcnow()
    thirty_days_ago = now - datetime.timedelta(days=30)
    
    bookings = db.query(
        Asset.name,
        AssetBooking.start_time,
        AssetBooking.end_time
    ).join(
        AssetBooking, AssetBooking.asset_id == Asset.id
    ).filter(
        AssetBooking.status == "Approved",
        AssetBooking.start_time >= thirty_days_ago
    ).all()

    asset_booking_hours = {}
    for asset_name, start, end in bookings:
        duration = end - start
        hours = duration.total_seconds() / 3600.0
        asset_booking_hours[asset_name] = asset_booking_hours.get(asset_name, 0.0) + hours

    total_hours_in_30_days = 30 * 24.0
    utilization_report = []
    for asset_name, booked_hours in asset_booking_hours.items():
        rate = (booked_hours / total_hours_in_30_days) * 100
        utilization_report.append(BookingUtilizationItem(
            asset_name=asset_name,
            total_booked_hours=round(booked_hours, 2),
            utilization_rate=round(rate, 2)
        ))

    return utilization_report
