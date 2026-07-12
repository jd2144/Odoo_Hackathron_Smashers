# AssetFlow Backend

The backend of AssetFlow is a robust, secure, and scalable REST API built to handle complex asset lifecycles, role-based workflows, and resource conflict validations. It acts as the core engine powering the AssetFlow platform.

## Tech Stack
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **ORM & Migrations**: SQLAlchemy / SQLModel, Alembic
- **Data Validation**: Pydantic
- **Security**: passlib, python-jose (JWT)

## Security, Authentication & Authorization
Security is paramount in AssetFlow. The backend enforces strict boundaries:
- **Authentication**: Utilizes OAuth2 with Password Flow (via FastAPI's `OAuth2PasswordBearer`). Passwords are securely hashed using bcrypt. Upon successful login, the client receives a JWT.
- **Authorization (RBAC)**: Role-Based Access Control is deeply integrated. Custom FastAPI dependencies validate user roles (Admin, Asset Manager, Department Head, Employee) before any endpoint business logic is executed.
- **General Security**: 
  - Cross-Origin Resource Sharing (CORS) configured for frontend communication.
  - SQL Injection prevention through the use of an ORM (SQLAlchemy).
  - Strict input validation using Pydantic models.

## Database Schema Design
The relational model is designed for PostgreSQL and managed through Alembic migrations:
- **Users**: Employees with assigned roles.
- **Departments**: Hierarchical structure of the organization.
- **Asset Categories**: Classification of assets.
- **Assets**: Core entities with the lifecycle states `Available`, `Allocated`, `Under Maintenance`, `Lost`, and `Decommissioned`.
- **Allocations & Transfers**: Tracks who holds what asset and when it is expected to be returned.
- **Bookings**: Time-bound reservations of shared resources.
- **Maintenance Requests**: Tracks the repair lifecycle.
- **Audits**: Cycles and discrepancy records.

## Core Modules & Business Logic
- **Allocation & Conflict Handling**: A PostgreSQL partial unique index ensures one active allocation per asset. PostgreSQL exclusion constraints and application validation prevent overlapping approved shared-resource bookings.
- **State Machine**: Assets transition seamlessly between states (e.g., automatically changing to 'Under Maintenance' when a request is approved).

## API Endpoints Strategy
The API follows RESTful principles:
- `/auth/*`: Login and session management.
- `/departments/*`: Hierarchy and master data.
- `/categories/*`: Asset classifications.
- `/assets/*`: CRUD operations, filtering, and lifecycle management.
- `/allocations/*`: Transfer requests, approvals, and returns.
- `/bookings/*`: Resource reservation with strict overlap checks.
- `/maintenance/*`: Repair workflow.
- `/audits/*`: Verification cycles and discrepancies.
- `/reports/*`: KPI dashboards and live depreciation calculators.
- `/notifications/*`: Inbox for user alerts and activity tracking.

## Development Setup

### 1. Prerequisites
- Python 3.10+
- PostgreSQL database

### 2. Environment Configuration
Create a `.env` file in the `backend` folder based on `.env.example` (or edit the existing one):
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=assetflow
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

### 3. Installation & Run
From the `backend` directory, run the following commands:
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt # or pip install list

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload
```

The API docs will be available at `http://127.0.0.1:8000/docs`.

## Testing & Quality Assurance

The codebase includes a comprehensive test suite powered by `pytest`.

### Running Tests
To run all tests (including our newly implemented backend validation tests):
```bash
# Activate your venv, then run:
pytest test/ -p no:warnings --tb=short
```

### Test Database Isolation
The test suite utilizes a highly secure, zero-pollution transactional testing pattern. Tests run against your configured PostgreSQL database (enabling real Postgres-specific features like GIST exclusion constraints), but each test runs inside a nested transaction that is automatically **rolled back** at the end. Your local development data remains untouched.
