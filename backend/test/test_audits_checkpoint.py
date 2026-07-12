import os
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

if os.path.exists("./test_audits_checkpoint.db"):
    os.remove("./test_audits_checkpoint.db")
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_audits_checkpoint.db"
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

def test_audit_lifecycle():
    db = TestingSessionLocal()
    
    cat = Category(id="cat-1", name="Laptops", code="LAP", total_assets_count=0)
    db.add(cat)
    db.commit()
    
    emp = Employee(id="emp-1", name="Test User", email="test@test.com", password_hash="hash", role="Employee")
    db.add(emp)
    
    # Asset 1: Will be Scanned
    asset1 = Asset(
        id="ast-audit-1", asset_tag="TAG-A1", name="Laptop 1", category_id="cat-1", 
        acquisition_date=datetime.date(2024, 1, 1), acquisition_cost=1000, location="Office", status="Available"
    )
    # Asset 2: Will be marked Missing
    asset2 = Asset(
        id="ast-audit-2", asset_tag="TAG-A2", name="Laptop 2", category_id="cat-1", 
        acquisition_date=datetime.date(2024, 1, 1), acquisition_cost=1000, location="Office", status="Available"
    )
    # Asset 3: Will be left Pending (forgot to scan, but not explicitly marked missing)
    asset3 = Asset(
        id="ast-audit-3", asset_tag="TAG-A3", name="Laptop 3", category_id="cat-1", 
        acquisition_date=datetime.date(2024, 1, 1), acquisition_cost=1000, location="Office", status="Available"
    )
    db.add_all([asset1, asset2, asset3])
    db.commit()
    db.close()

    # Start Audit
    response1 = client.post("/api/audits", json={"name": "Q3 Audit"})
    assert response1.status_code == 201
    audit_id = response1.json()["id"]

    # Scan Asset 1
    response2 = client.post(f"/api/audits/{audit_id}/scan?asset_id=ast-audit-1", json={"notes": "Found on desk"})
    assert response2.status_code == 200

    # Mark Asset 2 as Missing
    response3 = client.post(f"/api/audits/{audit_id}/review?asset_id=ast-audit-2", json={"notes": "Checked everywhere, missing"})
    assert response3.status_code == 200

    # Close Audit
    response4 = client.post(f"/api/audits/{audit_id}/close")
    assert response4.status_code == 200

    # Verify Asset Statuses
    db = TestingSessionLocal()
    ast1 = db.query(Asset).filter(Asset.id == "ast-audit-1").first()
    ast2 = db.query(Asset).filter(Asset.id == "ast-audit-2").first()
    ast3 = db.query(Asset).filter(Asset.id == "ast-audit-3").first()
    
    print(f"Asset 1 Status (Scanned): {ast1.status}")
    print(f"Asset 2 Status (Missing): {ast2.status}")
    print(f"Asset 3 Status (Pending/Forgotten): {ast3.status}")
    
    assert ast1.status == "Available"
    assert ast2.status == "Lost"
    assert ast3.status == "Available"

    print("Test Checkpoint Passed: Closing marks only confirmed-missing assets as Lost")

if __name__ == "__main__":
    test_audit_lifecycle()
