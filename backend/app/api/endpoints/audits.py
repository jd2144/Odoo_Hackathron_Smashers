from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
import uuid
from typing import List

from app.api.deps import get_db, get_current_active_user, get_current_active_manager_or_admin
from sqlalchemy import or_
from app.models.asset import Asset
from app.models.audit import AuditCycle, AuditItem
from app.models.user import Employee
from app.schemas.audit import AuditCycleCreate, AuditCycleResponse, AuditItemAction, AuditItemResponse

router = APIRouter()

@router.post("", response_model=AuditCycleResponse, status_code=status.HTTP_201_CREATED)
def start_audit_cycle(
    audit_in: AuditCycleCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_active_manager_or_admin)
):
    """
    Start a new audit cycle and populate it with all non-lost/non-decommissioned assets.
    """
    new_cycle = AuditCycle(
        id=f"audit-{uuid.uuid4().hex[:8]}",
        name=audit_in.name,
        initiated_by_id=current_user.id,
        status="In Progress",
        scope_department_id=audit_in.scope_department_id,
        scope_category_id=audit_in.scope_category_id,
        scope_location=audit_in.scope_location
    )
    
    if audit_in.auditor_ids:
        auditors = db.query(Employee).filter(Employee.id.in_(audit_in.auditor_ids)).all()
        new_cycle.auditors = auditors

    db.add(new_cycle)
    
    # Fetch all active assets (not lost, not retired/disposed)
    query = db.query(Asset).filter(
        Asset.status.notin_(["Lost", "Retired", "Disposed"])
    )
    
    if audit_in.scope_department_id:
        # Asset does not directly link to department, wait.
        # Oh, an asset might be allocated to a department or employee in a department?
        # Let's filter by assets currently allocated to employees of that department, or directly to that department.
        # Asset has current_holder_type and current_holder_id
        # Let's query allocations. If the active allocation has department_id or employee.department_id = scope_department_id.
        # Actually, simpler: check if there's an active allocation to the department, OR to an employee in that department.
        # Let's construct a subquery.
        from app.models.allocation import AssetAllocation
        from app.models.user import Employee as EmpModel
        allocated_asset_ids = db.query(AssetAllocation.asset_id).outerjoin(
            EmpModel, AssetAllocation.employee_id == EmpModel.id
        ).filter(
            AssetAllocation.status == "Active",
            or_(
                AssetAllocation.department_id == audit_in.scope_department_id,
                EmpModel.department_id == audit_in.scope_department_id
            )
        ).subquery()
        query = query.filter(Asset.id.in_(allocated_asset_ids))

    if audit_in.scope_category_id:
        query = query.filter(Asset.category_id == audit_in.scope_category_id)
        
    if audit_in.scope_location:
        query = query.filter(Asset.location == audit_in.scope_location)

    active_assets = query.all()
    
    for asset in active_assets:
        item = AuditItem(
            id=f"aitem-{uuid.uuid4().hex[:8]}",
            audit_cycle_id=new_cycle.id,
            asset_id=asset.id,
            status="Pending"
        )
        db.add(item)
        
    try:
        db.commit()
        db.refresh(new_cycle)
        return new_cycle
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An internal server error occurred.")


@router.post("/{id}/scan", response_model=AuditItemResponse)
def scan_audit_item(
    id: str,
    asset_id: str,
    action_in: AuditItemAction,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_active_user)
):
    """
    Mark an item as 'Scanned' (Found).
    """
    item = db.query(AuditItem).filter(
        AuditItem.audit_cycle_id == id,
        AuditItem.asset_id == asset_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Audit item not found in this cycle.")
        
    if item.audit_cycle.status == "Closed":
        raise HTTPException(status_code=400, detail="Cannot scan items in a closed audit.")

    if action_in.status not in ["Scanned", "Missing", "Damaged"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be Scanned, Missing, or Damaged.")

    item.status = action_in.status
    item.scanned_by_id = current_user.id
    item.scan_date = func.now()
    item.notes = action_in.notes

    if action_in.status == "Damaged":
        asset = db.query(Asset).filter(Asset.id == item.asset_id).first()
        if asset:
            asset.status = "Under Maintenance"

    try:
        db.commit()
        db.refresh(item)
        return item
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An internal server error occurred.")


@router.post("/{id}/review", response_model=AuditItemResponse)
def review_audit_item_as_missing(
    id: str,
    asset_id: str,
    action_in: AuditItemAction,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_active_manager_or_admin)
):
    """
    Explicitly mark a pending item as 'Missing'.
    """
    item = db.query(AuditItem).filter(
        AuditItem.audit_cycle_id == id,
        AuditItem.asset_id == asset_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Audit item not found.")

    if item.audit_cycle.status == "Closed":
        raise HTTPException(status_code=400, detail="Cannot review items in a closed audit.")

    item.status = "Missing"
    item.notes = action_in.notes

    try:
        db.commit()
        db.refresh(item)
        return item
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An internal server error occurred.")


@router.post("/{id}/close", response_model=AuditCycleResponse)
def close_audit_cycle(
    id: str,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_active_manager_or_admin)
):
    """
    Close the audit cycle. Only items explicitly marked as 'Missing' will transition the asset to 'Lost'.
    """
    cycle = db.query(AuditCycle).filter(AuditCycle.id == id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Audit cycle not found")
        
    if cycle.status == "Closed":
        raise HTTPException(status_code=400, detail="Audit cycle is already closed.")

    cycle.status = "Closed"
    cycle.end_date = func.now()

    # Update missing assets
    missing_items = [item for item in cycle.items if item.status == "Missing"]
    for item in missing_items:
        # We need to query the asset via DB session to update it properly
        asset = db.query(Asset).filter(Asset.id == item.asset_id).first()
        if asset:
            asset.status = "Lost"

    try:
        db.commit()
        db.refresh(cycle)
        return cycle
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

@router.get("/{id}/discrepancies", response_model=List[AuditItemResponse])
def get_audit_discrepancies(
    id: str,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_active_manager_or_admin)
):
    """
    Get all discrepancies in an audit cycle (Missing or Damaged items).
    """
    cycle = db.query(AuditCycle).filter(AuditCycle.id == id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Audit cycle not found")

    discrepancies = db.query(AuditItem).filter(
        AuditItem.audit_cycle_id == id,
        AuditItem.status.in_(["Missing", "Damaged"])
    ).all()

    return discrepancies
