import pytest
from datetime import datetime, timedelta, date, timezone
import hashlib
from app.main import app
from app.models.user import Employee, PasswordResetToken
from app.models.asset import Asset
from app.models.category import Category
from app.models.department import Department
from app.models.allocation import AssetAllocation
from app.models.booking import AssetBooking
from app.models.audit import AuditCycle, AuditItem

@pytest.fixture(autouse=True)
def setup_mocks(client, db_session, mock_admin):
    # Overrides dependencies to return mock_admin for auth checks
    from app.api.deps import get_current_active_user, get_current_active_admin, get_current_active_admin_or_asset_manager
    app.dependency_overrides[get_current_active_user] = lambda: mock_admin
    app.dependency_overrides[get_current_active_admin] = lambda: mock_admin
    app.dependency_overrides[get_current_active_admin_or_asset_manager] = lambda: mock_admin
    yield
    app.dependency_overrides.clear()

def test_password_reset_expiry_and_one_time_use(client, db_session):
    # Create employee to test password reset
    emp = Employee(id="emp-1", name="Emp One", email="emp1@test.com", password_hash="old_hash", role="Employee", status="Active")
    db_session.add(emp)
    db_session.commit()

    # 1. Request forgot password
    res_forgot = client.post("/api/auth/forgot-password", json={"email": "emp1@test.com"})
    assert res_forgot.status_code == 200
    
    # Fetch token from DB
    token_record = db_session.query(PasswordResetToken).filter(PasswordResetToken.user_id == "emp-1").first()
    assert token_record is not None
    
    # 2. Expiry test: make token expired
    token_record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.commit()
    
    raw_token = "expired_token_123"
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    
    expired_token = PasswordResetToken(
        id="prt-expired",
        user_id="emp-1",
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=1)
    )
    db_session.add(expired_token)
    db_session.commit()
    
    res_expired = client.post("/api/auth/reset-password", json={"token": raw_token, "new_password": "newpassword"})
    assert res_expired.status_code == 400 # Invalid or expired token
    
    # 3. Successful reset with valid token
    raw_valid = "valid_token_123"
    valid_hash = hashlib.sha256(raw_valid.encode()).hexdigest()
    
    valid_token = PasswordResetToken(
        id="prt-valid",
        user_id="emp-1",
        token_hash=valid_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
    )
    db_session.add(valid_token)
    db_session.commit()
    
    res_reset = client.post("/api/auth/reset-password", json={"token": raw_valid, "new_password": "newpassword"})
    assert res_reset.status_code == 200
    assert res_reset.json()["success"] is True
    
    # Check password updated
    db_session.refresh(emp)
    from app.core.security import verify_password
    assert verify_password("newpassword", emp.password_hash) is True
    
    # 4. One-time use test: attempting to reuse the same token should fail
    res_reuse = client.post("/api/auth/reset-password", json={"token": raw_valid, "new_password": "otherpassword"})
    assert res_reuse.status_code == 400


def test_employee_vs_department_allocation_validation(client, db_session):
    # Seed Category
    cat = Category(id="cat-1", name="Laptops", code="LAP")
    db_session.add(cat)
    # Seed Asset
    asset = Asset(
        id="ast-1", asset_tag="AST-101", name="Macbook", category_id="cat-1",
        location="Office", status="Available", acquisition_cost=1000,
        acquisition_date=date(2024, 1, 1)
    )
    db_session.add(asset)
    # Seed Department & Employee
    dept = Department(id="dept-1", name="IT", cost_center="IT-COST")
    db_session.add(dept)
    emp = Employee(id="emp-1", name="Test User", email="test@test.com", password_hash="hash")
    db_session.add(emp)
    # Seed Department Head
    head = Employee(id="dept-head-1", name="Dept Head", email="head@test.com", password_hash="hash", role="Department Head", department_id="dept-1")
    db_session.add(head)
    db_session.commit()

    # Test XOR Validation: Neither provided
    res_none = client.post("/api/assets/ast-1/allocate", json={"notes": "missing both"})
    assert res_none.status_code == 400
    assert "either" in res_none.json()["detail"].lower()

    # Test XOR Validation: Both provided
    res_both = client.post("/api/assets/ast-1/allocate", json={"employee_id": "emp-1", "department_id": "dept-1"})
    assert res_both.status_code == 400
    assert "both" in res_both.json()["detail"].lower()

    # Test Successful Employee Allocation
    res_emp = client.post("/api/assets/ast-1/allocate", json={"employee_id": "emp-1"})
    assert res_emp.status_code == 201
    
    # Return asset to allocate to department next
    res_return = client.post("/api/assets/ast-1/return", json={})
    assert res_return.status_code == 200
    
    # Test Successful Department Allocation
    res_dept = client.post("/api/assets/ast-1/allocate", json={"department_id": "dept-1"})
    assert res_dept.status_code == 201


def test_duplicate_cron_prevention(client, db_session):
    # Setup categories, assets, department, and employee
    cat = Category(id="cat-1", name="Laptops", code="LAP")
    db_session.add(cat)
    dept = Department(id="dept-1", name="IT", cost_center="IT-COST")
    db_session.add(dept)
    emp = Employee(id="emp-1", name="User One", email="user1@test.com", password_hash="hash")
    db_session.add(emp)
    # Seed Department Head for notifications
    head = Employee(id="dept-head-1", name="Dept Head", email="head@test.com", password_hash="hash", role="Department Head", department_id="dept-1")
    db_session.add(head)
    
    asset1 = Asset(id="ast-1", asset_tag="AST-1", name="Macbook 1", category_id="cat-1", location="Office", status="Available", acquisition_cost=1000, acquisition_date=date(2024, 1, 1))
    asset2 = Asset(id="ast-2", asset_tag="AST-2", name="Macbook 2", category_id="cat-1", location="Office", status="Available", acquisition_cost=1000, shared_bookable=True, acquisition_date=date(2024, 1, 1))
    db_session.add_all([asset1, asset2])
    db_session.commit()

    # Create Overdue Allocation
    alloc = AssetAllocation(
        id="alloc-overdue", asset_id="ast-1", employee_id="emp-1", 
        allocated_by_id="test-admin-id", expected_return_date=datetime.now(timezone.utc) - timedelta(days=2),
        status="Active"
    )
    db_session.add(alloc)

    # Create Booking needing Reminder (within 24 hours)
    booking = AssetBooking(
        id="book-reminder", asset_id="ast-2", employee_id="emp-1",
        start_time=datetime.now(timezone.utc) + timedelta(hours=12),
        end_time=datetime.now(timezone.utc) + timedelta(hours=14),
        status="Approved"
    )
    db_session.add(booking)
    db_session.commit()

    # First Cron invocation
    res_cron1 = client.post("/api/cron/daily-checks", headers={"X-Cron-Key": "dev-cron-secret"})
    assert res_cron1.status_code == 200
    data1 = res_cron1.json()
    assert data1["overdue_notified"] == 1
    assert data1["reminders_sent"] == 1

    # Second Cron invocation (idempotency should prevent duplicate alerts)
    res_cron2 = client.post("/api/cron/daily-checks", headers={"X-Cron-Key": "dev-cron-secret"})
    assert res_cron2.status_code == 200
    data2 = res_cron2.json()
    assert data2["overdue_notified"] == 0
    assert data2["reminders_sent"] == 0


def test_booking_reschedule_conflict_409(client, db_session):
    cat = Category(id="cat-1", name="Projectors", code="PRJ")
    db_session.add(cat)
    asset = Asset(id="ast-bookable", asset_tag="AST-PRJ", name="Projector A", category_id="cat-1", location="Conference Room", status="Available", shared_bookable=True, acquisition_cost=500, acquisition_date=date(2024, 1, 1))
    db_session.add(asset)
    
    # Seed 2 bookings
    # Booking 1: 14:00 - 16:00
    # Booking 2: 16:00 - 18:00
    b1 = AssetBooking(
        id="book-1", asset_id="ast-bookable", employee_id="test-admin-id",
        start_time=datetime.now(timezone.utc) + timedelta(hours=2),
        end_time=datetime.now(timezone.utc) + timedelta(hours=4),
        status="Approved"
    )
    b2 = AssetBooking(
        id="book-2", asset_id="ast-bookable", employee_id="test-admin-id",
        start_time=datetime.now(timezone.utc) + timedelta(hours=4),
        end_time=datetime.now(timezone.utc) + timedelta(hours=6),
        status="Approved"
    )
    db_session.add_all([b1, b2])
    db_session.commit()

    # Attempt to reschedule Booking 2 (16:00-18:00) to overlap with Booking 1 (e.g. 13:00 - 15:00)
    res = client.patch(
        "/api/bookings/book-2",
        json={
            "start_time": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            "end_time": (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat()
        }
    )
    assert res.status_code == 409
    assert "already booked" in res.json()["detail"].lower()


def test_damaged_audit_discrepancy(client, db_session):
    cat = Category(id="cat-1", name="Projectors", code="PRJ")
    db_session.add(cat)
    asset = Asset(id="ast-audited", asset_tag="AST-PRJ", name="Projector B", category_id="cat-1", location="Office", status="Available", acquisition_cost=500, acquisition_date=date(2024, 1, 1))
    db_session.add(asset)
    db_session.commit()

    # Start Audit Cycle
    res_start = client.post("/api/audits", json={"name": "Annual Audit 2026"})
    assert res_start.status_code == 201
    cycle_id = res_start.json()["id"]

    # Scan item as Damaged
    res_scan = client.post(f"/api/audits/{cycle_id}/scan?asset_id=ast-audited", json={"status": "Damaged", "notes": "Broken lens"})
    assert res_scan.status_code == 200

    # Asset should automatically transition to Under Maintenance
    db_session.refresh(asset)
    assert asset.status == "Under Maintenance"

    # Get discrepancy report and verify Damaged asset is listed
    res_disc = client.get(f"/api/audits/{cycle_id}/discrepancies")
    assert res_disc.status_code == 200
    disc_data = res_disc.json()
    assert len(disc_data) == 1
    assert disc_data[0]["asset_id"] == "ast-audited"
    assert disc_data[0]["status"] == "Damaged"
