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

if os.path.exists("./test_reports_checkpoint.db"):
    os.remove("./test_reports_checkpoint.db")
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_reports_checkpoint.db"
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

def override_get_current_active_manager_or_admin():
    return mock_admin

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_active_manager_or_admin] = override_get_current_active_manager_or_admin
app.dependency_overrides[get_current_active_user] = override_get_current_active_manager_or_admin

client = TestClient(app)

def test_reports_and_kpis():
    db = TestingSessionLocal()
    
    # 20% depreciation per year
    cat = Category(id="cat-1", name="Laptops", code="LAP", total_assets_count=0, depreciation_rate=20.0)
    db.add(cat)
    db.commit()
    
    # Acquire exactly 1 year ago (365 days ago)
    one_year_ago = datetime.date.today() - datetime.timedelta(days=365)
    
    # Add assets in various statuses
    a1 = Asset(id="ast-r1", asset_tag="T1", name="A1", category_id="cat-1", acquisition_date=one_year_ago, acquisition_cost=1000, location="Loc1", status="Available")
    a2 = Asset(id="ast-r2", asset_tag="T2", name="A2", category_id="cat-1", acquisition_date=one_year_ago, acquisition_cost=1000, location="Loc1", status="Allocated")
    a3 = Asset(id="ast-r3", asset_tag="T3", name="A3", category_id="cat-1", acquisition_date=one_year_ago, acquisition_cost=1000, location="Loc1", status="Under Maintenance")
    a4 = Asset(id="ast-r4", asset_tag="T4", name="A4", category_id="cat-1", acquisition_date=one_year_ago, acquisition_cost=1000, location="Loc1", status="Lost")
    
    db.add_all([a1, a2, a3, a4])
    db.commit()
    db.close()

    # 1. Test Dashboard KPIs
    resp_dash = client.get("/api/reports/dashboard")
    assert resp_dash.status_code == 200
    data_dash = resp_dash.json()
    print("Dashboard KPIs:", data_dash)
    
    assert data_dash["total_assets"] == 4
    assert data_dash["available_assets"] == 1
    assert data_dash["allocated_assets"] == 1
    assert data_dash["maintenance_assets"] == 1
    assert data_dash["lost_assets"] == 1

    # 2. Test Depreciation Report
    resp_dep = client.get("/api/reports/depreciation")
    assert resp_dep.status_code == 200
    data_dep = resp_dep.json()
    print("Depreciation Total Value:", data_dep["total_current_value"])
    
    # Lost assets should be excluded, leaving 3 assets (Available, Allocated, Maintenance)
    # Each cost 1000, 1 year elapsed, 20% rate -> $200 depreciation -> current value $800 each.
    # Total for 3 assets = $2400. (Roughly, within float tolerance due to 365.25 days math)
    
    assert len(data_dep["items"]) == 3
    # Check if roughly 2400
    assert 2350 < data_dep["total_current_value"] < 2450

    print("Test Checkpoint Passed: KPI counts and depreciation logic are correct")

if __name__ == "__main__":
    test_reports_and_kpis()
