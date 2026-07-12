# Aureon ERP – Enterprise Asset & Resource Management System
## Backend Development Backlog & Prioritization Guide

This backlog lists the precise backend tasks required to replace the mock database layer with real operational microservices, database storage, and secure endpoints.

---

## Task Priority Tiers

1. **Tier A (Critical Foundations):** Database Setup, OAuth/Authentication, and Asset Directory APIs.
2. **Tier B (Core Operations):** Logistics Custody, Booking Schedules, and Maintenance Work Orders.
3. **Tier C (Audit & Control):** Compliance Audits, Asset Transfer Approvals, and Multi-Level Security Roles.
4. **Tier D (Intelligence & Reporting):** Custom Reports Scheduler, Depreciation Automation, and Real-time Alerts.

---

## Tier A: Critical Foundations

### Task 1: Provision Cloud Database & Schema Setup
* **Priority:** Critical (Tier A)
* **Estimated Effort:** 4 hours
* **Description:** Install PostgreSQL database instance. Construct migrations using the schema specification outlined in `docs/API_INTEGRATION.md`. Create indexes on hot lookup columns: `assets(asset_tag)`, `assets(status)`, `employees(email)`.
* **Security Checkpoint:** Ensure database is securely bound and password-protected.

### Task 2: JWT Secure Auth Microservice
* **Priority:** Critical (Tier A)
* **Estimated Effort:** 6 hours
* **Description:** Implement `POST /api/auth/login` endpoint. Use `bcrypt` or modern hashing libraries to hash password entries. Generate robust JWT token payloads on successful validation. Create authorization middleware to check the `Bearer` header token on all downstream secure requests.
* **Security Checkpoint:** Apply proper CORS configuration, securely sign JWTs with a strong env variable secret.

### Task 3: Asset Directory CRUD APIs
* **Priority:** Critical (Tier A)
* **Estimated Effort:** 6 hours
* **Description:** Implement `GET /api/assets` (supports search, category, and status filters) and `POST /api/assets` (registers physical property records). Automatically auto-generate unique corporate `assetTag` stamps (e.g. `AST-YYYY-[SEQ]`) if serial codes are omitted.
* **Security Checkpoint:** Strictly authorize write operations so only `Admin` and `Manager` profiles can execute resource registration.

---

## Tier B: Core Operations

### Task 4: Resource Scheduling Reservation System
* **Priority:** High (Tier B)
* **Estimated Effort:** 8 hours
* **Description:** Implement reservation lookup queries and booking registrations (`GET /api/bookings`, `POST /api/bookings`). Implement strict transactional checks to prevent overlap collisions on duplicate resources. If start date and end date overlap with any active reservations for a given `assetId`, abort the operation and return a clear `409 Conflict` payload with error details.
* **Security Checkpoint:** Verify requester profile matches the reservation claimant email.

### Task 5: Maintenance Ticketing & Kanban Controls
* **Priority:** High (Tier B)
* **Estimated Effort:** 8 hours
* **Description:** Implement ticketing and transition endpoints (`POST /api/maintenance`, `PUT /api/maintenance/:id/assign`, `PUT /api/maintenance/:id/resolve`). Resolving a maintenance ticket should run a database transaction updating the corresponding asset status back to `'Available'`.
* **Security Checkpoint:** Log resolving worker's name to completion logs for historical tracking.

---

## Tier C: Audit & Control

### Task 6: Logistics Assignment & Ownership Transfers
* **Priority:** Medium (Tier C)
* **Estimated Effort:** 8 hours
* **Description:** Build endpoints supporting assignment and transfers (`POST /api/allocations`, `POST /api/transfers`, `PUT /api/transfers/:id/approve`). If a manager tries to allocate an asset already checked out, raise an `ALLOCATION_OVERLAP_CONFLICT` error so the frontend can activate the Conflict Resolution flow (proposing a formal Transfer Request).
* **Security Checkpoint:** Restrict approval controls strictly to `Admin` and `Manager` profiles.

### Task 7: Compliance Audit Engine
* **Priority:** Medium (Tier C)
* **Estimated Effort:** 10 hours
* **Description:** Create endpoints to run and close audit verification cycles (`POST /api/audits`, `PUT /api/audit-items/:id`, `POST /api/audits/:id/close`). The closing endpoint must run in a database transaction: loop over all unverified check list records, update any assets flagged as `'Missing'` to status `'Lost'`, and append system-wide alert logs.
* **Security Checkpoint:** Block duplicate active audit cycles from starting.

---

## Tier D: Intelligence & Reporting

### Task 8: Organization setups & department cost centers
* **Priority:** Low (Tier D)
* **Estimated Effort:** 4 hours
* **Description:** Implement setup endpoint routes for organizational layouts (`POST /api/departments`, `POST /api/categories`, `POST /api/employees`).
* **Security Checkpoint:** Restrict employee invitation controls exclusively to `Admin` role accounts.

### Task 9: Custom Reports & Automation
* **Priority:** Low (Tier D)
* **Estimated Effort:** 6 hours
* **Description:** Implement statistics routing tables (`GET /api/reports/depreciation`, `GET /api/reports/utilization`). Integrate depreciation calculation libraries dynamically decreasing asset current value over time.
* **Security Checkpoint:** Sanitize filter lookups protecting databases from execution injections.
