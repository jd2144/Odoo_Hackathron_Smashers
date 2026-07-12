# Aureon ERP – Enterprise Asset & Resource Management System
## Master Backend Integration Manual

This document provides a highly detailed specification for the backend services, APIs, database structures, and authentication protocols required to integrate with the completed Aureon ERP frontend.

---

## 1. Global Specifications

### 1.1 Authentication & Authorization
* **Mechanism:** JSON Web Token (JWT) provided in the `Authorization` header of each secure request.
* **Format:** `Authorization: Bearer <JWT_TOKEN>`
* **Expiration:** Standard token lifespan is 8 hours with automatic sliding refresh.
* **Roles:**
  * `Admin`: Universal write and read access, including audit creation, user roles management, and deletion controls.
  * `Manager` (e.g., Asset Manager): Access to logistics, allocation finalization, maintenance assignments, and organizational department setups.
  * `Employee`: General staff member. Access to search assets, submit maintenance requests, book resources, and initiate transfer proposals.

### 1.2 Global Error Envelope
Every error response must match this schema for consistent toast representation in the frontend:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable descriptive error message detailing corrective action.",
    "fields": {
      "fieldName": ["Validation rule failed details"]
    }
  }
}
```

---

## 2. Database Schema Design (PostgreSQL / Relational)

The following tables define the relational schema required by the core models (`/src/types/index.ts`):

### 2.1 `departments`
* `id` (VARCHAR(50), Primary Key)
* `name` (VARCHAR(100), Not Null)
* `cost_center` (VARCHAR(50), Unique)
* `created_at` (TIMESTAMP)

### 2.2 `employees`
* `id` (VARCHAR(50), Primary Key)
* `name` (VARCHAR(100), Not Null)
* `email` (VARCHAR(150), Unique, Not Null)
* `password_hash` (VARCHAR(255), Not Null)
* `role` (VARCHAR(30)) — e.g., `'Admin' | 'Manager' | 'Employee'`
* `department_id` (VARCHAR(50), Foreign Key references `departments(id)`)
* `status` (VARCHAR(20)) — e.g., `'Active' | 'Deactivated'`

### 2.3 `categories`
* `id` (VARCHAR(50), Primary Key)
* `name` (VARCHAR(100), Not Null)
* `code` (VARCHAR(20), Unique) — e.g., `'IT', 'LAB', 'OFF'`
* `depreciation_rate` (DECIMAL(5, 2)) — Annual percentage deduction
* `total_assets_count` (INTEGER, Default 0)

### 2.4 `assets`
* `id` (VARCHAR(50), Primary Key)
* `asset_tag` (VARCHAR(50), Unique, Not Null) — e.g., `'AST-2026-0001'`
* `name` (VARCHAR(150), Not Null)
* `category_id` (VARCHAR(50), Foreign Key references `categories(id)`)
* `serial_number` (VARCHAR(100), Unique)
* `acquisition_date` (DATE, Not Null)
* `acquisition_cost` (DECIMAL(12, 2), Not Null)
* `current_value` (DECIMAL(12, 2))
* `condition` (VARCHAR(30)) — `'New' | 'Good' | 'Fair' | 'Poor' | 'Broken'`
* `location` (VARCHAR(100), Not Null)
* `status` (VARCHAR(30)) — `'Available' | 'Allocated' | 'Under Maintenance' | 'Reserved' | 'Lost' | 'Retired' | 'Disposed'`
* `shared_bookable` (BOOLEAN, Default False)
* `qr_code_url` (TEXT)
* `current_holder_type` (VARCHAR(20)) — `'Employee' | 'Department' | Null`
* `current_holder_id` (VARCHAR(50)) — Points to Employee ID or Department ID

### 2.5 `bookings`
* `id` (VARCHAR(50), Primary Key)
* `asset_id` (VARCHAR(50), Foreign Key references `assets(id)`)
* `employee_id` (VARCHAR(50), Foreign Key references `employees(id)`)
* `start_date` (DATE, Not Null)
* `end_date` (DATE, Not Null)
* `purpose` (TEXT, Not Null)
* `status` (VARCHAR(30)) — `'Active' | 'Cancelled' | 'Completed'`

### 2.6 `maintenance_tickets`
* `id` (VARCHAR(50), Primary Key)
* `asset_id` (VARCHAR(50), Foreign Key references `assets(id)`)
* `requested_by_id` (VARCHAR(50), Foreign Key references `employees(id)`)
* `assigned_to_id` (VARCHAR(50), Foreign Key references `employees(id)`, Nullable)
* `priority` (VARCHAR(20)) — `'Low' | 'Medium' | 'High' | 'Critical'`
* `status` (VARCHAR(30)) — `'Pending' | 'In Progress' | 'Resolved' | 'Cancelled'`
* `description` (TEXT, Not Null)
* `cost` (DECIMAL(10, 2), Default 0)
* `completion_notes` (TEXT)
* `created_at` (TIMESTAMP)

### 2.7 `audit_cycles`
* `id` (VARCHAR(50), Primary Key)
* `name` (VARCHAR(150), Not Null)
* `scope_type` (VARCHAR(50)) — e.g., `'All' | 'Department'`
* `start_date` (DATE, Not Null)
* `end_date` (DATE, Not Null)
* `status` (VARCHAR(30)) — `'Active' | 'Completed'`
* `closed_date` (DATE, Nullable)

### 2.8 `audit_items`
* `id` (VARCHAR(50), Primary Key)
* `audit_cycle_id` (VARCHAR(50), Foreign Key references `audit_cycles(id)`)
* `asset_id` (VARCHAR(50), Foreign Key references `assets(id)`)
* `status` (VARCHAR(30)) — `'Pending' | 'Verified' | 'Missing' | 'Damaged'`
* `verified_date` (TIMESTAMP, Nullable)
* `auditor_id` (VARCHAR(50), Foreign Key references `employees(id)`, Nullable)
* `notes` (TEXT)

---

## 3. Detailed Screen API Specifications

### 3.1 Authentication Screen (Login)
* **API Route:** `POST /api/auth/login`
* **Access Level:** Public
* **Request DTO:**
  ```json
  {
    "email": "user@corporation.com",
    "password": "SecurePassword123"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "emp-1",
      "name": "Sarah Connor",
      "email": "user@corporation.com",
      "role": "Admin",
      "departmentId": "dept-1"
    }
  }
  ```

---

### 3.2 Directory Screen (`AssetManagement.tsx`)
* **Endpoint 1:** `GET /api/assets` (Lists items, supports optional query filters `search`, `categoryId`, `status`)
  * **Access Level:** JWT Authorized (Any role)
  * **Success Response (200 OK):** `Asset[]`
* **Endpoint 2:** `POST /api/assets` (Creates new physical record)
  * **Access Level:** Admin/Manager Only
  * **Request Body:**
    ```json
    {
      "name": "Dell UltraSharp 32 Monitor",
      "categoryId": "cat-1",
      "serialNumber": "SN-98234-A",
      "acquisitionCost": 1250,
      "location": "HQ - Floor 4",
      "sharedBookable": true
    }
    ```
  * **Validation Requirements:**
    * `name` must be non-empty, max length 150 characters.
    * `categoryId` must map to a valid record in `categories` table.
    * `acquisitionCost` must be a positive decimal numeric.

---

### 3.3 Custody Logistics Screen (`AssetAllocation.tsx`)
* **Endpoint 1:** `POST /api/allocations` (Finalizes custody assignment)
  * **Access Level:** Admin/Manager Only
  * **Request Body:**
    ```json
    {
      "assetId": "ast-2",
      "holderId": "emp-4",
      "holderType": "Employee",
      "expectedReturnDate": "2026-12-31"
    }
    ```
  * **Conflict Logic:** If `assetId` has `status` as `'Allocated'`, throw **409 Conflict** return payload:
    ```json
    {
      "success": false,
      "error": {
        "code": "ALLOCATION_OVERLAP_CONFLICT",
        "message": "Asset is currently checked out to Sarah Connor.",
        "currentHolderId": "emp-2",
        "currentHolderName": "Sarah Connor"
      }
    }
    ```
* **Endpoint 2:** `POST /api/transfers` (Requests safe change-of-custody transfer)
  * **Request Body:** `{ "assetId": "ast-2", "toEmployeeId": "emp-4", "reason": "Department Transfer" }`
* **Endpoint 3:** `PUT /api/transfers/:id/approve` (Approve Transfer)
* **Endpoint 4:** `PUT /api/transfers/:id/reject` (Reject Transfer)
* **Endpoint 5:** `POST /api/assets/:id/return` (Performs physical check-in returning asset to general inventory)
  * **Request Body:** `{ "condition": "Good", "notes": "Cords returned neatly coiled." }`

---

### 3.4 Resource Scheduling Screen (`ResourceBooking.tsx`)
* **Endpoint 1:** `GET /api/bookings`
* **Endpoint 2:** `POST /api/bookings` (Logs booking reservation)
  * **Request Body:**
    ```json
    {
      "assetId": "ast-12",
      "startDate": "2026-08-01",
      "endDate": "2026-08-05",
      "purpose": "H1 Strategic Client Project Presentation Setup"
    }
    ```
  * **Conflict Checks:** Validate date windows. No overlapping active bookings are allowed on identical resources. If overlap exists, return **409 Conflict**.
* **Endpoint 3:** `DELETE /api/bookings/:id` (Cancel reservation)

---

### 3.5 Maintenance Ticketing Screen (`Maintenance.tsx`)
* **Endpoint 1:** `GET /api/maintenance` (Retrieves repair tickets log)
* **Endpoint 2:** `POST /api/maintenance` (Logs standard/emergency repair ticket)
  * **Request Body:** `{ "assetId": "ast-1", "priority": "High", "description": "Screen backlight flickering severely." }`
* **Endpoint 3:** `PUT /api/maintenance/:id/assign` (Appoints a technician worker)
  * **Request Body:** `{ "assignedToId": "emp-3" }`
* **Endpoint 4:** `PUT /api/maintenance/:id/resolve` (Completes the ticket, returns asset status to available)
  * **Request Body:** `{ "notes": "Flickering backlight replaced", "cost": 150 }`

---

### 3.6 Compliance Sweep Screen (`AssetAudit.tsx`)
* **Endpoint 1:** `POST /api/audits` (Launches clean sweep verifying physical records)
  * **Request Body:** `{ "name": "Marketing Lab Sweep FY26 Q3" }`
* **Endpoint 2:** `PUT /api/audit-items/:id` (Updates audit state check status)
  * **Request Body:** `{ "status": "Verified" | "Missing" | "Damaged", "notes": "Condition verified" }`
* **Endpoint 3:** `POST /api/audits/:id/close` (Locks historical records)
  * **Business Rules:** Loops over all pending check list items. Assets marked `'Missing'` have their inventory status automatically changed to `'Lost'`. Alerts are fired immediately.

---

### 3.7 Organization Setup Screen (`OrganizationSetup.tsx`)
* **Endpoint 1:** `POST /api/departments` (Creates new departments/cost centers)
* **Endpoint 2:** `POST /api/categories` (Adds asset categorizations)
* **Endpoint 3:** `POST /api/employees` (Invites worker profiles to system access roles)

---

### 3.8 Notifications Center (`Notifications.tsx`)
* **Endpoint 1:** `GET /api/notifications`
* **Endpoint 2:** `PUT /api/notifications/:id/read` (Mark notification as read)

---

### 3.9 Reporting Screen (`Reports.tsx`)
* **Endpoint 1:** `GET /api/reports/depreciation`
* **Endpoint 2:** `GET /api/reports/utilization`
* **Endpoint 3:** `POST /api/reports/schedule` (Schedules custom operational summaries)

---

## 4. Summary Matrix of Required Services

| Screen File | Main Service Method | API Method | API URL | Expected Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `Login.tsx` | `authService.login` | **POST** | `/api/auth/login` | 200, 401, 422 |
| `AssetManagement.tsx` | `assetService.getAssets` | **GET** | `/api/assets` | 200, 401 |
| `AssetManagement.tsx` | `assetService.registerAsset`| **POST** | `/api/assets` | 201, 400, 403 |
| `AssetAllocation.tsx` | `assetService.allocateAsset` | **POST** | `/api/allocations` | 201, 409, 403 |
| `AssetAllocation.tsx` | `assetService.requestTransfer`| **POST** | `/api/transfers` | 201, 400 |
| `AssetAllocation.tsx` | `assetService.approveTransfer`| **PUT** | `/api/transfers/:id/approve` | 200, 403 |
| `AssetAllocation.tsx` | `assetService.returnAsset` | **POST** | `/api/assets/:id/return`| 200, 401, 403 |
| `ResourceBooking.tsx` | `bookingService.bookAsset` | **POST** | `/api/bookings` | 201, 409, 400 |
| `Maintenance.tsx` | `maintenanceService.createTicket`| **POST** | `/api/maintenance` | 201, 400 |
| `Maintenance.tsx` | `maintenanceService.assignTicket`| **PUT** | `/api/maintenance/:id/assign` | 200, 403 |
| `AssetAudit.tsx` | `MockDatabase.saveAudits` | **POST** | `/api/audits` | 201, 400, 403 |
| `AssetAudit.tsx` | `MockDatabase.saveAuditItems`| **PUT** | `/api/audit-items/:id` | 200, 404 |
| `OrganizationSetup.tsx`| `assetService.createDepartment`| **POST** | `/api/departments` | 201, 400 |
