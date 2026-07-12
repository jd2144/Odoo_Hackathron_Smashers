from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
import uuid
from typing import List
from datetime import datetime

from app.api.deps import get_db, get_current_active_user
from app.models.asset import Asset
from app.models.booking import AssetBooking
from app.models.user import Employee
from app.schemas.booking import BookingCreate, BookingResponse, BookingUpdate
from app.services.notifications import log_activity, create_notification

router = APIRouter()

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_active_user)
):
    """
    Create a new booking for a shared asset.
    """
    # 1. Lock the asset row to serialize concurrent booking attempts
    asset = db.query(Asset).filter(Asset.id == booking_in.asset_id).with_for_update().first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if not asset.shared_bookable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This asset is not configured as shared/bookable."
        )

    # 2. Check for overlaps
    # Overlap logic: (existing_start < new_end) AND (existing_end > new_start)
    overlapping_booking = db.query(AssetBooking).filter(
        AssetBooking.asset_id == booking_in.asset_id,
        AssetBooking.status == "Approved",
        AssetBooking.start_time < booking_in.end_time,
        AssetBooking.end_time > booking_in.start_time
    ).first()

    if overlapping_booking:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The asset is already booked during this time period."
        )

    # 3. Create the booking
    new_booking = AssetBooking(
        id=f"book-{uuid.uuid4().hex[:8]}",
        asset_id=booking_in.asset_id,
        employee_id=current_user.id,
        start_time=booking_in.start_time,
        end_time=booking_in.end_time,
        purpose=booking_in.purpose,
        status="Approved"
    )

    db.add(new_booking)
    try:
        db.commit()
        db.refresh(new_booking)
        log_activity(db, current_user.id, "CREATE_BOOKING", "AssetBooking", new_booking.id, f"Booked asset {booking_in.asset_id}")
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

    # Note: Asset status remains unchanged until the booking window begins.
    # Future enhancement: A background job to mark asset as "In Use" when booking starts.

    return new_booking


@router.get("", response_model=List[BookingResponse])
def list_bookings(
    asset_id: str = Query(None, description="Filter by asset ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_active_user)
):
    """
    List bookings. Can be filtered by asset.
    """
    query = db.query(AssetBooking)
    
    if asset_id:
        query = query.filter(AssetBooking.asset_id == asset_id)
        
    bookings = query.order_by(AssetBooking.start_time.asc()).offset(skip).limit(limit).all()
    return bookings

@router.patch("/{id}", response_model=BookingResponse)
def update_booking(
    id: str,
    booking_in: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_active_user)
):
    """
    Cancel or reschedule a booking.
    """
    booking = db.query(AssetBooking).filter(AssetBooking.id == id).with_for_update().first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if booking.employee_id != current_user.id and current_user.role not in ["Admin", "Asset Manager"]:
        raise HTTPException(status_code=403, detail="Not authorized to modify this booking")

    new_start = booking_in.start_time or booking.start_time
    new_end = booking_in.end_time or booking.end_time
    
    if booking_in.start_time or booking_in.end_time:
        # Prevent rescheduling to the past
        now_compare = datetime.now(new_start.tzinfo) if new_start.tzinfo else datetime.utcnow()
        if new_start < now_compare and new_start != booking.start_time:
            raise HTTPException(status_code=400, detail="Cannot schedule a booking in the past")
            
        # Overlap check
        overlapping_booking = db.query(AssetBooking).filter(
            AssetBooking.asset_id == booking.asset_id,
            AssetBooking.id != booking.id,
            AssetBooking.status == "Approved",
            AssetBooking.start_time < new_end,
            AssetBooking.end_time > new_start
        ).first()

        if overlapping_booking:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The asset is already booked during this time period."
            )
            
        booking.start_time = new_start
        booking.end_time = new_end

    if booking_in.status:
        if booking_in.status not in ["Approved", "Cancelled"]:
            raise HTTPException(status_code=400, detail="Status must be Approved or Cancelled")
        booking.status = booking_in.status

    try:
        db.commit()
        db.refresh(booking)
        log_activity(db, current_user.id, "UPDATE_BOOKING", "AssetBooking", booking.id)
        if booking.status == "Cancelled":
            create_notification(db, booking.employee_id, "Booking Cancelled", f"Your booking {booking.id} was cancelled.")
        db.commit()
        return booking
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
