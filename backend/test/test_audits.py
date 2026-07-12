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

def test_audit_lifecycle(client, db_session):
    cat = Category(id="cat-1", name="Laptops", code="LAP", total_assets_count=0)
    db_session.add(cat)
    
    emp = Employee(id="emp-1", name="Test User", email="test@test.com", password_hash="hash", role="Employee")
    db_session.add(emp)
    
    # Asset 1: Will be Scanned
    asset1 = Asset(
        id="ast-audit-1", asset_tag="TAG-A1", name="Laptop 1", category_id="cat-1", 
        acquisition_date=date(2024, 1, 1), acquisition_cost=1000, location="Office", status="Available"
    )
    # Asset 2: Will be marked Missing
    asset2 = Asset(
        id="ast-audit-2", asset_tag="TAG-A2", name="Laptop 2", category_id="cat-1", 
        acquisition_date=date(2024, 1, 1), acquisition_cost=1000, location="Office", status="Available"
    )
    # Asset 3: Will be left Pending (forgot to scan, but not explicitly marked missing)
    asset3 = Asset(
        id="ast-audit-3", asset_tag="TAG-A3", name="Laptop 3", category_id="cat-1", 
        acquisition_date=date(2024, 1, 1), acquisition_cost=1000, location="Office", status="Available"
    )
    db_session.add_all([asset1, asset2, asset3])
    db_session.commit()

    # Start Audit
    response1 = client.post("/api/audits", json={"name": "Q3 Audit"})
    assert response1.status_code == 201
    audit_id = response1.json()["id"]

    # Scan Asset 1
    response2 = client.post(f"/api/audits/{audit_id}/scan?asset_id=ast-audit-1", json={"notes": "Found on desk", "status": "Scanned"})
    assert response2.status_code == 200

    # Mark Asset 2 as Missing
    response3 = client.post(f"/api/audits/{audit_id}/review?asset_id=ast-audit-2", json={"notes": "Checked everywhere, missing", "status": "Missing"})
    assert response3.status_code == 200

    # Close Audit
    response4 = client.post(f"/api/audits/{audit_id}/close")
    assert response4.status_code == 200

    # Verify Asset Statuses
    db_session.refresh(asset1)
    db_session.refresh(asset2)
    db_session.refresh(asset3)
    
    assert asset1.status == "Available"
    assert asset2.status == "Lost"
    assert asset3.status == "Available"
