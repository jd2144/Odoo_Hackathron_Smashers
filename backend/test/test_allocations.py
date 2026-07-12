import pytest
from datetime import date
from app.main import app
from app.models.user import Employee
from app.models.asset import Asset
from app.models.category import Category

@pytest.fixture(autouse=True)
def setup_mocks(client, db_session, mock_admin):
    from app.api.deps import get_current_active_manager_or_admin, get_current_active_user
    app.dependency_overrides[get_current_active_manager_or_admin] = lambda: mock_admin
    app.dependency_overrides[get_current_active_user] = lambda: mock_admin
    yield
    app.dependency_overrides.clear()

def test_double_allocation(client, db_session):
    # Seed data
    cat = Category(id="cat-1", name="Laptops", code="LAP", total_assets_count=0)
    db_session.add(cat)
    
    emp = Employee(id="emp-1", name="Test User", email="test@test.com", password_hash="hash")
    db_session.add(emp)
    
    asset = Asset(
        id="ast-1", 
        asset_tag="TAG1", 
        name="Laptop", 
        category_id="cat-1", 
        acquisition_date=date(2024, 1, 1), 
        acquisition_cost=1000, 
        location="Office", 
        status="Available"
    )
    db_session.add(asset)
    db_session.commit()

    # Allocate once
    response1 = client.post("/api/assets/ast-1/allocate", json={"employee_id": "emp-1"})
    assert response1.status_code == 201

    # Allocate twice (should fail with 409)
    response2 = client.post("/api/assets/ast-1/allocate", json={"employee_id": "emp-1"})
    assert response2.status_code == 409
