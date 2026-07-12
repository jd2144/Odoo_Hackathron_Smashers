import os
import uuid
import sys
import datetime

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base
from app.api.deps import get_db, get_current_active_user
from app.models.user import Employee
from app.models.asset import Asset
from app.models.category import Category

# Setup in-memory sqlite for testing
if os.path.exists("./test_bookings_checkpoint.db"):
    os.remove("./test_bookings_checkpoint.db")
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_bookings_checkpoint.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

mock_user = Employee(id="emp-1", email="test@test.com", role="Employee", status="Active")

def override_get_current_active_user():
    return mock_user

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_active_user] = override_get_current_active_user

client = TestClient(app)

def test_overlapping_bookings():
    db = TestingSessionLocal()
    
    # Seed data
    cat = Category(id="cat-1", name="Projectors", code="PRJ", total_assets_count=0)
    db.add(cat)
    db.commit()
    
    emp = Employee(id="emp-1", name="Test User", email="test@test.com", password_hash="hash")
    db.add(emp)
    
    # Create a shared/bookable asset
    asset = Asset(
        id="ast-book-1", 
        asset_tag="TAG-BOOK-1", 
        name="Conference Projector", 
        category_id="cat-1", 
        acquisition_date=datetime.date(2024, 1, 1), 
        acquisition_cost=500, 
        location="Room A", 
        status="Available",
        shared_bookable=True
    )
    db.add(asset)
    db.commit()
    db.close()

    # Booking 1: Oct 1st 10:00 to 12:00
    b1_payload = {
        "asset_id": "ast-book-1",
        "start_time": "2026-10-01T10:00:00Z",
        "end_time": "2026-10-01T12:00:00Z",
        "purpose": "Morning Presentation"
    }
    response1 = client.post("/api/bookings", json=b1_payload)
    print("Booking 1:", response1.status_code, response1.json())
    assert response1.status_code == 201

    # Booking 2: Oct 1st 11:00 to 13:00 (Overlaps!)
    b2_payload = {
        "asset_id": "ast-book-1",
        "start_time": "2026-10-01T11:00:00Z",
        "end_time": "2026-10-01T13:00:00Z",
        "purpose": "Lunch Meeting"
    }
    response2 = client.post("/api/bookings", json=b2_payload)
    print("Booking 2 (Overlap):", response2.status_code, response2.json())
    assert response2.status_code == 409

    # Booking 3: Oct 1st 12:00 to 14:00 (Does NOT overlap, starts exactly when B1 ends)
    b3_payload = {
        "asset_id": "ast-book-1",
        "start_time": "2026-10-01T12:00:00Z",
        "end_time": "2026-10-01T14:00:00Z",
        "purpose": "Afternoon Workshop"
    }
    response3 = client.post("/api/bookings", json=b3_payload)
    print("Booking 3 (Sequential):", response3.status_code, response3.json())
    assert response3.status_code == 201

    print("Test Checkpoint Passed: Overlapping booking returns 409")

if __name__ == "__main__":
    test_overlapping_bookings()
