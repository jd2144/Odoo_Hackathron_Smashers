import os
import uuid
import sys
import datetime

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base
from app.api.deps import get_db, get_current_active_user, get_current_active_manager_or_admin
from app.models.user import Employee
from app.models.asset import Asset
from app.models.category import Category
from app.models.maintenance import MaintenanceRecord

if os.path.exists("./test_maintenance_checkpoint.db"):
    os.remove("./test_maintenance_checkpoint.db")
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_maintenance_checkpoint.db"
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
mock_admin = Employee(id="admin-1", email="admin@test.com", role="Admin", status="Active")

def override_get_current_active_user():
    return mock_user

def override_get_current_active_manager_or_admin():
    return mock_admin

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_active_user] = override_get_current_active_manager_or_admin
app.dependency_overrides[get_current_active_manager_or_admin] = override_get_current_active_manager_or_admin

client = TestClient(app)

def test_maintenance_lifecycle():
    db = TestingSessionLocal()
    
    cat = Category(id="cat-1", name="Laptops", code="LAP", total_assets_count=0)
    db.add(cat)
    db.commit()
    
    emp = Employee(id="emp-1", name="Test User", email="test@test.com", password_hash="hash", role="Employee")
    db.add(emp)
    
    asset = Asset(
        id="ast-maint-1", 
        asset_tag="TAG-MAINT-1", 
        name="Broken Laptop", 
        category_id="cat-1", 
        acquisition_date=datetime.date(2024, 1, 1), 
        acquisition_cost=1000, 
        location="Office", 
        status="Available"
    )
    db.add(asset)
    db.commit()
    db.close()

    # Create Ticket
    m_payload = {
        "asset_id": "ast-maint-1",
        "issue_description": "Screen is flickering"
    }
    response1 = client.post("/api/maintenance", json=m_payload)
    print("Ticket Created:", response1.status_code, response1.json())
    assert response1.status_code == 201
    ticket_id = response1.json()["id"]

    # Invalid Transition: Pending -> In Progress (Should be 400)
    invalid_payload = {
        "status": "In Progress"
    }
    response2 = client.patch(f"/api/maintenance/{ticket_id}", json=invalid_payload)
    print("Invalid Transition:", response2.status_code, response2.json())
    assert response2.status_code == 400
    assert "Invalid transition" in response2.json()["detail"]

    # Valid Transition: Pending -> Approved
    valid_payload = {
        "status": "Approved"
    }
    response3 = client.patch(f"/api/maintenance/{ticket_id}", json=valid_payload)
    print("Valid Transition:", response3.status_code, response3.json())
    assert response3.status_code == 200

    print("Test Checkpoint Passed: Invalid lifecycle transition is rejected")

if __name__ == "__main__":
    test_maintenance_lifecycle()
