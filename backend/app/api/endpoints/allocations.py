from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import func
from typing import List
import uuid
from datetime import datetime

from app.api.deps import get_db, get_current_active_user, get_current_active_manager_or_admin
from app.models.asset import Asset
from app.models.allocation import AssetAllocation, AssetTransfer
from app.models.user import Employee
from app.schemas.allocation import (
    AllocationCreate, AllocationReturn, AllocationResponse,
    TransferCreate, TransferDecision, TransferResponse
)
from app.services.notifications import create_notification, log_activity

router = APIRouter()

@router.post("/assets/{id}/allocate", response_model=AllocationResponse, status_code=status.HTTP_201_CREATED)
def allocate_asset(
    id: str,
    allocation_in: AllocationCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_active_manager_or_admin)
):
    """
    Assign an asset to an employee.
    """
    asset = db.query(Asset).filter(Asset.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    if asset.status not in ["Available", "Returned"]:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Asset is not available for allocation. Current status: {asset.status}")

    employee = db.query(Employee).filter(Employee.id == allocation_in.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    new_allocation = AssetAllocation(
        id=f"alloc-{uuid.uuid4().hex[:8]}",
        asset_id=id,
        employee_id=allocation_in.employee_id,
        allocated_by_id=current_user.id,
        notes=allocation_in.notes
    )

    db.add(new_allocation)
    
    # Update asset state
    asset.status = "Allocated"
    asset.current_holder_type = "Employee"
    asset.current_holder_id = employee.id

    try:
        db.commit()
        db.refresh(new_allocation)
        
        # Notify the assigned employee
        create_notification(
            db=db,
            user_id=employee.id,
            title="Asset Allocated",
            message=f"Asset {asset.name} ({asset.asset_tag}) has been allocated to you."
        )
        log_activity(db, current_user.id, "ALLOCATE_ASSET", "Asset", asset.id, f"Allocated to {employee.name}")
        db.commit()
        
        return new_allocation
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This asset is already actively allocated."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An internal server error occurred.")


@router.post("/assets/{id}/return", response_model=AllocationResponse)
def return_asset(
    id: str,
    return_in: AllocationReturn,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_active_manager_or_admin)
):
    """
    Return an actively allocated asset.
    """
    allocation = db.query(AssetAllocation).filter(
        AssetAllocation.asset_id == id,
        AssetAllocation.status == "Active"
    ).first()

    if not allocation:
        raise HTTPException(status_code=404, detail="No active allocation found for this asset.")

    allocation.status = "Returned"
    allocation.return_date = func.now()
    if return_in.notes:
        allocation.notes = f"{allocation.notes or ''} | Return note: {return_in.notes}"

    asset = db.query(Asset).filter(Asset.id == id).first()
    asset.status = "Available"
    asset.current_holder_type = None
    asset.current_holder_id = None

    try:
        db.commit()
        db.refresh(allocation)
        
        log_activity(db, current_user.id, "RETURN_ASSET", "Asset", asset.id, f"Returned by {allocation.employee_id}")
        db.commit()
        
        return allocation
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An internal server error occurred.")


@router.post("/assets/{id}/transfer", response_model=TransferResponse, status_code=status.HTTP_201_CREATED)
def request_transfer(
    id: str,
    transfer_in: TransferCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_active_user)
):
    """
    Request transfer of an asset to another employee.
    """
    allocation = db.query(AssetAllocation).filter(
        AssetAllocation.asset_id == id,
        AssetAllocation.status == "Active"
    ).first()

    if not allocation:
        raise HTTPException(status_code=404, detail="No active allocation found for this asset to transfer.")
        
    if allocation.employee_id != current_user.id and current_user.role not in ["Admin", "Asset Manager"]:
        raise HTTPException(status_code=403, detail="Not authorized to transfer this asset.")
        
    recipient = db.query(Employee).filter(Employee.id == transfer_in.to_employee_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient employee not found")

    new_transfer = AssetTransfer(
        id=f"trans-{uuid.uuid4().hex[:8]}",
        asset_id=id,
        from_employee_id=allocation.employee_id,
        to_employee_id=recipient.id,
        requested_by_id=current_user.id,
        reason=transfer_in.reason
    )

    db.add(new_transfer)
    try:
        db.commit()
        db.refresh(new_transfer)
        
        # Notify admins/managers about the request
        managers = db.query(Employee).filter(Employee.role.in_(["Admin", "Asset Manager"])).all()
        for mgr in managers:
            create_notification(db, mgr.id, "Transfer Request", f"Transfer requested for asset {id}")
        db.commit()
        
        return new_transfer
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An internal server error occurred.")


@router.patch("/transfers/{id}", response_model=TransferResponse)
def decide_transfer(
    id: str,
    decision_in: TransferDecision,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_active_manager_or_admin)
):
    """
    Approve or reject a transfer request.
    On approval, close the old active allocation and create a new active allocation for the recipient in the same transaction.
    """
    if decision_in.status not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Decision must be 'Approved' or 'Rejected'")

    transfer = db.query(AssetTransfer).filter(AssetTransfer.id == id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer request not found")

    if transfer.status != "Pending":
        raise HTTPException(status_code=400, detail=f"Transfer is already {transfer.status}")

    transfer.status = decision_in.status
    transfer.approved_by_id = current_user.id
    transfer.decision_date = func.now()

    if decision_in.status == "Approved":
        # Find active allocation
        allocation = db.query(AssetAllocation).filter(
            AssetAllocation.asset_id == transfer.asset_id,
            AssetAllocation.status == "Active",
            AssetAllocation.employee_id == transfer.from_employee_id
        ).first()

        if not allocation:
            db.rollback()
            raise HTTPException(status_code=400, detail="The active allocation for this asset has changed or no longer exists.")

        # Mark old allocation as transferred
        allocation.status = "Transferred"
        allocation.return_date = func.now()

        # Create new allocation
        new_allocation = AssetAllocation(
            id=f"alloc-{uuid.uuid4().hex[:8]}",
            asset_id=transfer.asset_id,
            employee_id=transfer.to_employee_id,
            allocated_by_id=current_user.id,
            notes=f"Transferred from {transfer.from_employee_id} (Transfer ID: {transfer.id})"
        )
        db.add(new_allocation)

        # Update Asset
        asset = db.query(Asset).filter(Asset.id == transfer.asset_id).first()
        asset.current_holder_id = transfer.to_employee_id

        try:
            db.commit()
            
            # Notifications
            create_notification(db, transfer.to_employee_id, "Transfer Approved", f"Asset {asset.name} transferred to you.")
            create_notification(db, transfer.from_employee_id, "Transfer Approved", f"Asset {asset.name} transferred away from you.")
            db.commit()
            
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Database conflict while approving transfer."
            )
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail="An internal server error occurred.")
    else:
        # Rejected
        try:
            db.commit()
            create_notification(db, transfer.from_employee_id, "Transfer Rejected", f"Transfer for asset {transfer.asset_id} was rejected.")
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail="An internal server error occurred.")

    db.refresh(transfer)
    return transfer
