from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from datetime import datetime, timedelta
from typing import Optional

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.models.allocation import AssetAllocation
from app.models.booking import AssetBooking
from app.models.user import Employee
from app.models.department import Department
from app.services.notifications import create_notification

router = APIRouter()

@router.post("/daily-checks", status_code=status.HTTP_200_OK)
def run_daily_checks(
    x_cron_key: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Cron job endpoint to process overdue allocations and upcoming booking reminders.
    Authorized via either static X-Cron-Key or Bearer token (Admin only).
    """
    # Authorization checks
    authorized = False
    if x_cron_key and x_cron_key == settings.CRON_SECRET:
        authorized = True
    elif authorization:
        # Try validating standard admin login
        from app.api.deps import oauth2_scheme, jwt, TokenPayload, JWTError
        try:
            token = authorization.split(" ")[1] if " " in authorization else authorization
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            token_data = TokenPayload(**payload)
            user = db.query(Employee).filter(Employee.id == token_data.sub).first()
            if user and user.role == "Admin" and user.status == "Active":
                authorized = True
        except (JWTError, IndexError):
            pass

    if not authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authorized to run cron processes."
        )

    now = datetime.utcnow()
    reminder_limit = now + timedelta(hours=24)

    # 1. Process Overdue Allocations
    overdue_allocations = db.query(AssetAllocation).filter(
        AssetAllocation.status == "Active",
        AssetAllocation.expected_return_date < now,
        AssetAllocation.overdue_notified_at == None
    ).all()

    overdue_count = 0
    for alloc in overdue_allocations:
        target_user_id = None
        if alloc.employee_id:
            target_user_id = alloc.employee_id
        elif alloc.department_id:
            dept = db.query(Department).filter(Department.id == alloc.department_id).first()
            if dept:
                dept_head = db.query(Employee).filter(
                    Employee.department_id == dept.id,
                    Employee.role == "Department Head"
                ).first()
                target_user_id = dept_head.id if dept_head else None

        if target_user_id:
            create_notification(
                db=db,
                user_id=target_user_id,
                title="Asset Overdue Alert",
                message=f"The allocated asset {alloc.asset.name} was due on {alloc.expected_return_date.strftime('%Y-%m-%d')}. Please return it immediately."
            )
        alloc.overdue_notified_at = now
        overdue_count += 1

    # 2. Process Booking Reminders (within 24 hours)
    upcoming_bookings = db.query(AssetBooking).filter(
        AssetBooking.status == "Approved",
        AssetBooking.start_time > now,
        AssetBooking.start_time <= reminder_limit,
        AssetBooking.reminder_sent_at == None
    ).all()

    reminder_count = 0
    for booking in upcoming_bookings:
        create_notification(
            db=db,
            user_id=booking.employee_id,
            title="Upcoming Booking Reminder",
            message=f"Reminder: You have an approved booking for asset {booking.asset.name} starting on {booking.start_time.strftime('%Y-%m-%d %H:%M')}."
        )
        booking.reminder_sent_at = now
        reminder_count += 1

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database transaction failed during cron checks.")

    return {
        "success": True,
        "overdue_notified": overdue_count,
        "reminders_sent": reminder_count
    }
