import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event as sa_event
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.config import settings
from app.core.database import Base
from app.api.deps import get_db, get_current_active_user, get_current_active_admin, get_current_active_admin_or_asset_manager
from app.models.user import Employee

# Create engine using the real PostgreSQL connection string from settings
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Make sure all tables exist in PostgreSQL
    Base.metadata.create_all(bind=engine)
    yield

@pytest.fixture
def db_session():
    """
    Fixture that runs each test inside a transaction that is rolled back at the end.
    Ensures absolute test isolation and zero side-effects on development data.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Nest another transaction so tests can call commit() without committing to the real DB
    nested = connection.begin_nested()

    @sa_event.listens_for(session, "after_transaction_end")
    def end_savepoint(session, transaction):
        nonlocal nested
        if not nested.is_active:
            nested = connection.begin_nested()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    # Override get_db to return our transactional session
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def mock_admin(db_session):
    admin = db_session.query(Employee).filter(Employee.email == "test-admin@assetflow.com").first()
    if not admin:
        admin = Employee(
            id="test-admin-id",
            name="Admin Test",
            email="test-admin@assetflow.com",
            password_hash="hashed",
            role="Admin",
            status="Active"
        )
        db_session.add(admin)
        db_session.commit()
    return admin

@pytest.fixture
def mock_employee(db_session):
    emp = db_session.query(Employee).filter(Employee.email == "test-emp@assetflow.com").first()
    if not emp:
        emp = Employee(
            id="test-emp-id",
            name="Employee Test",
            email="test-emp@assetflow.com",
            password_hash="hashed",
            role="Employee",
            status="Active"
        )
        db_session.add(emp)
        db_session.commit()
    return emp
