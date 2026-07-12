# AssetFlow Frontend

The frontend of AssetFlow is designed to be a highly responsive, user-centric, and interactive application. It is built by a dedicated frontend developer using the modern React 19 ecosystem.

## Tech Stack
- **Core Framework**: React 19, TypeScript
- **Styling & Components**: Tailwind CSS, shadcn/ui, Lucide Icons
- **Animations**: Framer Motion
- **Routing**: React Router
- **State Management & Data Fetching**: TanStack Query
- **Forms & Validation**: React Hook Form
- **Tables & Data Grids**: TanStack Table
- **Data Visualization**: Recharts

## Application Structure & Key Screens

### 1. Login / Signup Screen
- **Purpose**: Authenticate users securely.
- **Features**: Employee signup, JWT-based session validation, and password recovery.

### 2. Dashboard / Home Screen
- **Purpose**: Real-time operational snapshot.
- **Features**: KPI cards (Assets Available, Allocated, Active Bookings), highlighted overdue returns, and quick actions using Recharts for visual analytics.

### 3. Organization Setup Screen (Admin Only)
- **Purpose**: Manage master data (Departments, Asset Categories, Employee Directory).
- **Features**: Create/edit hierarchies, assign roles (Promote to Dept Head/Asset Manager).

### 4. Asset Registration & Directory Screen
- **Purpose**: Centralized tracking of assets.
- **Features**: Asset Tag auto-generation, QR code support, lifecycle status tracking, and history logs. Uses TanStack Table for efficient data rendering.

### 5. Asset Allocation & Transfer Screen
- **Purpose**: Manage asset ownership and transfers.
- **Features**: Conflict handling (blocking double allocation), transfer request workflows, and overdue allocation tracking.

### 6. Resource Booking Screen
- **Purpose**: Time-slot booking of shared resources.
- **Features**: Calendar view, strict overlap validation (preventing double booking), and status management.

### 7. Maintenance Management Screen
- **Purpose**: Handle repair requests and approvals.
- **Features**: Approval workflow (Pending -> Approved -> In Progress -> Resolved) and automatic asset status updates.

### 8. Asset Audit Screen
- **Purpose**: Structured verification cycles.
- **Features**: Auditor assignments, discrepancy flagging (Verified/Missing/Damaged), and auto-generated reports.

### 9. Reports & Analytics Screen
- **Purpose**: Actionable operational insight.
- **Features**: Asset utilization trends, maintenance frequency, and department-wise allocation summaries powered by Recharts.

### 10. Activity Logs & Notifications Screen
- **Purpose**: System-wide traceability.
- **Features**: Audit logs of all actions and real-time alerts for overdue items or approvals.

## Mockup Reference
View the UI/UX Mockup POC: [AssetFlow Excalidraw](https://app.excalidraw.com/l/65VNwvy7c4X/5ceOBMjbDby)
