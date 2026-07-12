import os
import uuid
import sys

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base
from app.api.deps import get_db, get_current_active_manager_or_admin, get_current_active_user
from app.models.user import Employee
from app.models.asset import Asset
from app.models.category import Category

# Setup in-memory sqlite for testing
if os.path.exists("./test_checkpoint.db"):
    os.remove("./test_checkpoint.db")
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_checkpoint.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Mock admin user dependency
mock_admin = Employee(id="test-admin", email="admin@test.com", role="Admin", status="Active")

def override_get_current_active_admin():
    return mock_admin

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_active_manager_or_admin] = override_get_current_active_admin
app.dependency_overrides[get_current_active_user] = override_get_current_active_admin

client = TestClient(app)

def test_double_allocation():
    db = TestingSessionLocal()
    
    # Seed data
    cat = Category(id="cat-1", name="Laptops", code="LAP", total_assets_count=0)
    db.add(cat)
    db.commit()
    
    emp = Employee(id="emp-1", name="Test User", email="test@test.com", password_hash="hash")
    db.add(emp)
    
    import datetime
    asset = Asset(
        id="ast-1", 
        asset_tag="TAG1", 
        name="Laptop", 
        category_id="cat-1", 
        acquisition_date=datetime.date(2024, 1, 1), 
        acquisition_cost=1000, 
        location="Office", 
        status="Available"
    )
    db.add(asset)
    db.commit()
    db.close()

    # Allocate once
    response1 = client.post("/api/assets/ast-1/allocate", json={"employee_id": "emp-1"})
    print("Allocation 1:", response1.status_code, response1.json())
    assert response1.status_code == 201

    # Allocate twice (should fail with 409)
    response2 = client.post("/api/assets/ast-1/allocate", json={"employee_id": "emp-1"})
    print("Allocation 2:", response2.status_code, response2.json())
    assert response2.status_code == 409
    
    print("Test Checkpoint Passed: Double allocation returns 409")

if __name__ == "__main__":
    test_double_allocation()
