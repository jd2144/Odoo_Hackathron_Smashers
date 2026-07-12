import pytest
from datetime import date, timedelta
from app.main import app
from app.models.asset import Asset
from app.models.category import Category

@pytest.fixture(autouse=True)
def setup_mocks(client, db_session, mock_admin):
    from app.api.deps import get_current_active_user, get_current_active_manager_or_admin
    app.dependency_overrides[get_current_active_user] = lambda: mock_admin
    app.dependency_overrides[get_current_active_manager_or_admin] = lambda: mock_admin
    yield
    app.dependency_overrides.clear()

def test_reports_and_kpis(client, db_session):
    # 20% depreciation per year
    cat = Category(id="cat-1", name="Laptops", code="LAP", total_assets_count=0, depreciation_rate=20.0)
    db_session.add(cat)
    db_session.commit()
    
    # Acquire exactly 1 year ago (365 days ago)
    one_year_ago = date.today() - timedelta(days=365)
    
    # Add assets in various statuses
    a1 = Asset(id="ast-r1", asset_tag="T1", name="A1", category_id="cat-1", acquisition_date=one_year_ago, acquisition_cost=1000, location="Loc1", status="Available")
    a2 = Asset(id="ast-r2", asset_tag="T2", name="A2", category_id="cat-1", acquisition_date=one_year_ago, acquisition_cost=1000, location="Loc1", status="Allocated")
    a3 = Asset(id="ast-r3", asset_tag="T3", name="A3", category_id="cat-1", acquisition_date=one_year_ago, acquisition_cost=1000, location="Loc1", status="Under Maintenance")
    a4 = Asset(id="ast-r4", asset_tag="T4", name="A4", category_id="cat-1", acquisition_date=one_year_ago, acquisition_cost=1000, location="Loc1", status="Lost")
    
    db_session.add_all([a1, a2, a3, a4])
    db_session.commit()

    # 1. Test Dashboard KPIs
    resp_dash = client.get("/api/reports/dashboard")
    assert resp_dash.status_code == 200
    data_dash = resp_dash.json()
    
    assert data_dash["total_assets"] == 4
    assert data_dash["available_assets"] == 1
    assert data_dash["allocated_assets"] == 1
    assert data_dash["maintenance_assets"] == 1
    assert data_dash["lost_assets"] == 1

    # 2. Test Depreciation Report
    resp_dep = client.get("/api/reports/depreciation")
    assert resp_dep.status_code == 200
    data_dep = resp_dep.json()
    
    assert len(data_dep["items"]) == 3
    # Check if roughly 2400
    assert 2350 < data_dep["total_current_value"] < 2450
