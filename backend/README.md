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

## Testing & Quality Assurance
The repository includes executable checkpoint scripts for allocation, booking, maintenance, audits, and reports. They use FastAPI's `TestClient` with an isolated SQLite database to verify key business rules. PostgreSQL should be used in deployed environments so database-level partial and exclusion constraints are active.
