from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.sql import func
import uuid
from typing import List

from app.api.deps import get_db, get_current_active_user, get_current_active_manager_or_admin
from app.models.asset import Asset
from app.models.maintenance import MaintenanceRecord
from app.models.allocation import AssetAllocation
from app.models.booking import AssetBooking
from app.models.user import Employee
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse
from app.services.notifications import create_notification, log_activity

router = APIRouter()

@router.post("", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_ticket(
    maintenance_in: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_active_user)
):
    """
    Create a new maintenance ticket (Pending).
    """
    asset = db.query(Asset).filter(Asset.id == maintenance_in.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    new_record = MaintenanceRecord(
        id=f"maint-{uuid.uuid4().hex[:8]}",
        asset_id=maintenance_in.asset_id,
        requested_by_id=current_user.id,
        issue_description=maintenance_in.issue_description,
        status="Pending"
    )

    db.add(new_record)
    try:
        db.commit()
        db.refresh(new_record)
        log_activity(db, current_user.id, "CREATE_MAINTENANCE", "MaintenanceRecord", new_record.id, f"Ticket created for asset {asset.id}")
        db.commit()
        return new_record
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An internal server error occurred.")


@router.patch("/{id}", response_model=MaintenanceResponse)
def update_maintenance_ticket(
    id: str,
    update_in: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_active_user)
):
    """
    Update a maintenance ticket status following the lifecycle:
    Pending → Approved → Assigned → In Progress → Resolved
    """
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")

    valid_transitions = {
        "Pending": ["Approved", "Rejected"],
        "Approved": ["Assigned"],
        "Assigned": ["In Progress"],
        "In Progress": ["Resolved"]
    }

    if update_in.status not in valid_transitions.get(record.status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from {record.status} to {update_in.status}"
        )

    # Role-based checks
    if update_in.status in ["Approved", "Rejected"]:
        if current_user.role not in ["Admin", "Asset Manager", "Department Head"]:
            raise HTTPException(status_code=403, detail="Not authorized to approve maintenance.")
        record.approved_by_id = current_user.id

    if update_in.status == "Assigned":
        if current_user.role not in ["Admin", "Asset Manager"]:
            raise HTTPException(status_code=403, detail="Not authorized to assign maintenance.")
        if not update_in.assigned_to_id:
            raise HTTPException(status_code=400, detail="Must provide assigned_to_id when assigning.")
            
        technician = db.query(Employee).filter(Employee.id == update_in.assigned_to_id).first()
        if not technician:
            raise HTTPException(status_code=404, detail="Assigned technician/employee not found.")
            
        record.assigned_to_id = update_in.assigned_to_id

    if update_in.status in ["In Progress", "Resolved"]:
        if current_user.role not in ["Admin", "Asset Manager"] and current_user.id != record.assigned_to_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this ticket progress.")

    # Status side-effects
    record.status = update_in.status
    asset = db.query(Asset).filter(Asset.id == record.asset_id).first()

    if update_in.status == "Approved":
        # Block if asset is allocated
        active_alloc = db.query(AssetAllocation).filter(
            AssetAllocation.asset_id == record.asset_id,
            AssetAllocation.status == "Active"
        ).first()
        if active_alloc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Asset must be returned from its active allocation before maintenance can be approved."
            )
            
        # Block if there is another open maintenance ticket for this asset
        open_ticket = db.query(MaintenanceRecord).filter(
            MaintenanceRecord.asset_id == record.asset_id,
            MaintenanceRecord.status.in_(["Approved", "Assigned", "In Progress"]),
            MaintenanceRecord.id != record.id
        ).first()
        if open_ticket:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Asset already has an open maintenance ticket."
            )
            
        asset.status = "Under Maintenance"

    if update_in.status == "Resolved":
        record.resolution_notes = update_in.resolution_notes
        
        # Check for active allocations or bookings before marking Available
        active_allocation = db.query(AssetAllocation).filter(
            AssetAllocation.asset_id == asset.id, 
            AssetAllocation.status == "Active"
        ).first()
        
        active_booking = db.query(AssetBooking).filter(
            AssetBooking.asset_id == asset.id,
            AssetBooking.status == "Approved",
            AssetBooking.start_time <= func.now(),
            AssetBooking.end_time >= func.now()
        ).first()

        if active_allocation:
            asset.status = "Allocated"
        elif active_booking:
            # If we want a specific 'Booked' or 'In Use' status here, we'd set it.
            # But based on our bookings logic, it remains 'Available' if it's currently available,
            # wait, if it's being used for a booking right now, maybe it's "In Use". 
            # For now, default fallback is Available unless allocated.
            asset.status = "Available"
        else:
            asset.status = "Available"

    try:
        db.commit()
        db.refresh(record)
        
        # Notifications
        if update_in.status == "Assigned" and record.assigned_to_id:
            create_notification(db, record.assigned_to_id, "Maintenance Assigned", f"You have been assigned to maintenance ticket {record.id}")
            db.commit()
            
        log_activity(db, current_user.id, f"MAINTENANCE_{update_in.status.upper()}", "MaintenanceRecord", record.id)
        
        return record
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
