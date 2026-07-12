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
  - Rate limiting to prevent brute-force attacks.
  - Strict input validation using Pydantic models.

## Database Schema Design
The relational model is designed in PostgreSQL to maintain absolute data integrity:
- **Users**: Employees with assigned roles.
- **Departments**: Hierarchical structure of the organization.
- **Asset Categories**: Classification of assets.
- **Assets**: Core entities with a flexible lifecycle state (Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed).
- **Allocations & Transfers**: Tracks who holds what asset and when it is expected to be returned.
- **Bookings**: Time-bound reservations of shared resources.
- **Maintenance Requests**: Tracks the repair lifecycle.
- **Audits**: Cycles and discrepancy records.

## Core Modules & Business Logic
- **Allocation & Conflict Handling**: Algorithms ensure that an asset cannot be allocated to two employees simultaneously. Overlapping logic prevents time-slot conflicts for shared resources.
- **State Machine**: Assets transition seamlessly between states (e.g., automatically changing to 'Under Maintenance' when a request is approved).
- **Background Tasks/Scheduling**: Periodic background processes run to generate audit cycles and flag overdue returns and bookings.

## API Endpoints Strategy
The API follows RESTful principles:
- `/auth/*`: Login, Signup, Password Management.
- `/users/*`: Employee directory and role assignments (Admin only).
- `/departments/*`: Hierarchy and master data.
- `/assets/*`: CRUD operations, filtering, and lifecycle management.
- `/allocations/*`: Transfer requests, approvals, and returns.
- `/bookings/*`: Resource reservation with strict overlap checks.
- `/maintenance/*`: Repair workflow.
- `/audits/*`: Verification cycles and discrepancies.
- `/analytics/*`: Aggregated data for Recharts on the frontend.

## Testing & Quality Assurance
To ensure the robustness and reliability of the backend, the following testing strategies will be implemented using `pytest` and `httpx`:
- **Unit Tests**: Coverage for individual functions, business logic (e.g., allocation overlap logic), and utility classes.
- **Integration Tests**: Verification of API endpoints via `TestClient`, ensuring proper database interaction, authentication flow, and RBAC validation.
- **Mocking**: Database dependencies and external services will be mocked during unit testing to ensure fast and isolated test execution.
- **Test Database**: A separate, ephemeral PostgreSQL testing database will be used during the test suite execution.
