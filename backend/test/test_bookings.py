import pytest
from datetime import date
from app.main import app
from app.models.user import Employee
from app.models.asset import Asset
from app.models.category import Category

@pytest.fixture(autouse=True)
def setup_mocks(client, db_session, mock_employee):
    from app.api.deps import get_current_active_user
    app.dependency_overrides[get_current_active_user] = lambda: mock_employee
    yield
    app.dependency_overrides.clear()

def test_overlapping_bookings(client, db_session):
    # Seed data
    cat = Category(id="cat-1", name="Projectors", code="PRJ", total_assets_count=0)
    db_session.add(cat)
    
    emp = Employee(id="emp-1", name="Test User", email="test@test.com", password_hash="hash")
    db_session.add(emp)
    
    # Create a shared/bookable asset
    asset = Asset(
        id="ast-book-1", 
        asset_tag="TAG-BOOK-1", 
        name="Conference Projector", 
        category_id="cat-1", 
        acquisition_date=date(2024, 1, 1), 
        acquisition_cost=500, 
        location="Room A", 
        status="Available",
        shared_bookable=True
    )
    db_session.add(asset)
    db_session.commit()

    # Booking 1: Oct 1st 10:00 to 12:00
    b1_payload = {
        "asset_id": "ast-book-1",
        "start_time": "2026-10-01T10:00:00Z",
        "end_time": "2026-10-01T12:00:00Z",
        "purpose": "Morning Presentation"
    }
    response1 = client.post("/api/bookings", json=b1_payload)
    assert response1.status_code == 201

    # Booking 2: Oct 1st 11:00 to 13:00 (Overlaps!)
    b2_payload = {
        "asset_id": "ast-book-1",
        "start_time": "2026-10-01T11:00:00Z",
        "end_time": "2026-10-01T13:00:00Z",
        "purpose": "Lunch Meeting"
    }
    response2 = client.post("/api/bookings", json=b2_payload)
    assert response2.status_code == 409

    # Booking 3: Oct 1st 12:00 to 14:00 (Does NOT overlap, starts exactly when B1 ends)
    b3_payload = {
        "asset_id": "ast-book-1",
        "start_time": "2026-10-01T12:00:00Z",
        "end_time": "2026-10-01T14:00:00Z",
        "purpose": "Afternoon Workshop"
    }
    response3 = client.post("/api/bookings", json=b3_payload)
    assert response3.status_code == 201
