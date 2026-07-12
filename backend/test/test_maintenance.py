import pytest
from datetime import date
from app.main import app
from app.models.user import Employee
from app.models.asset import Asset
from app.models.category import Category

@pytest.fixture(autouse=True)
def setup_mocks(client, db_session, mock_admin):
    from app.api.deps import get_current_active_user, get_current_active_manager_or_admin
    app.dependency_overrides[get_current_active_user] = lambda: mock_admin
    app.dependency_overrides[get_current_active_manager_or_admin] = lambda: mock_admin
    yield
    app.dependency_overrides.clear()

def test_maintenance_lifecycle(client, db_session):
    # Seed data
    cat = Category(id="cat-1", name="Laptops", code="LAP", total_assets_count=0)
    db_session.add(cat)
    
    emp = Employee(id="emp-1", name="Test User", email="test@test.com", password_hash="hash", role="Employee")
    db_session.add(emp)
    
    asset = Asset(
        id="ast-maint-1", 
        asset_tag="TAG-MAINT-1", 
        name="Broken Laptop", 
        category_id="cat-1", 
        acquisition_date=date(2024, 1, 1), 
        acquisition_cost=1000, 
        location="Office", 
        status="Available"
    )
    db_session.add(asset)
    db_session.commit()

    # Create Ticket
    m_payload = {
        "asset_id": "ast-maint-1",
        "issue_description": "Screen is flickering"
    }
    response1 = client.post("/api/maintenance", json=m_payload)
    assert response1.status_code == 201
    ticket_id = response1.json()["id"]

    # Invalid Transition: Pending -> In Progress (Should be 400)
    invalid_payload = {
        "status": "In Progress"
    }
    response2 = client.patch(f"/api/maintenance/{ticket_id}", json=invalid_payload)
    assert response2.status_code == 400
    assert "Invalid transition" in response2.json()["detail"]

    # Valid Transition: Pending -> Approved
    valid_payload = {
        "status": "Approved"
    }
    response3 = client.patch(f"/api/maintenance/{ticket_id}", json=valid_payload)
    assert response3.status_code == 200
