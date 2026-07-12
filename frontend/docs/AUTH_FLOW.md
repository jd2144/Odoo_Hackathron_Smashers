# Aureon ERP Enterprise Identity, Authentication, and Authorization Engine

This document details the production-ready architecture, security protocols, and state machines governing credentials, session integrity, multi-factor verification, and granular permissions within the **Aureon ERP** Enterprise Asset Management Suite.

---

## 1. Authentication Lifecycle & Flows

Aureon ERP implements a bifurcated authentication system that balances rapid staff convenience with strict administrative defense.

### A. Employee, Department Head, and Asset Manager Login
1. **User Identity Submission**: The user submits their `Email` or `Username` along with their `Password` to the `/api/auth/login` gateway.
2. **Standard Authentication Check**: The backend verifies the credential hashes.
3. **Account Status Verification**:
   - If `status === 'Active'`, the system signs a JWT token and responds with user profile data.
   - If `status === 'Pending Approval'`, the system issues a temporary restricted session token, redirecting the client to the **Waiting For Approval** viewport.
   - If `status === 'Rejected'`, the client is locked into the **Rejection & Resubmission** dashboard.
   - If `status === 'Inactive'`, authentication fails with a `403 Forbidden` status code.

### B. Admin Multi-Step 2FA Login
Administrative accounts (holding `Admin` roles) are fortified by mandatory Two-Factor Authentication (2FA) via one-time passcodes (OTP).

```
[ Admin Email Entry ] 
        │
        ▼
[ API: Check Role ] ──( If Admin )──► [ API: Dispatch OTP ] 
                                             │
                                             ▼
                                     [ OTP Email Sent ]
                                             │
                                             ▼
[ Master Password Entry ] ◄──( If Verified )── [ API: Verify OTP ]
        │
        ▼
[ API: Issue Admin JWT ] ──► [ Admin ERP Control Center Access ]
```

1. **Identifier Entry**: Admin inputs `admin@aureonerp.com` (or other Admin registered identifiers).
2. **2FA Assertion Trigger**: The login client queries the gateway. Upon identifying an administrative role, the password entry is deferred, and a secure 6-digit OTP code is generated and dispatched to the Admin’s verified email.
3. **OTP Code Verification**: The Admin enters the OTP, which is validated against the transient session key.
4. **Credential Verification**: Once the 2FA layer is verified, the Admin provides their `Username` and master `Password` to seal the session.
5. **Signed Admin Token Issuance**: The server generates a high-privilege JWT token containing specific `Admin` claims, unlocking the master console.

---

## 2. Token & Session Management (JWT Structure)

All authenticated transactions are authorized using standard **JSON Web Tokens (JWT)** transmitted in the `Authorization: Bearer <JWT_TOKEN>` HTTP header.

### Simulated / Production JWT Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### JWT Payload Schema (Claims)
```json
{
  "sub": "emp-1",
  "name": "Alexander Wright",
  "email": "admin@aureonerp.com",
  "username": "admin",
  "role": "Admin",
  "status": "Active",
  "dept": "dep-1",
  "iss": "aureon-auth-authority",
  "aud": "aureon-enterprise-client",
  "iat": 1783850239,
  "exp": 1783936639
}
```

---

## 3. Account Approval & Registration Lifecycle State Machine

Users cannot self-promote to high security clearances. The registration approval workflow is enforced by the **User Approval Center** page.

```
       [ Client Sign Up ]
               │
               ▼
   State: Pending Approval ──( Rejected by Admin )──► State: Rejected
               │                                            │
       ( Approved by Admin )                         ( Resubmitted by User )
               │                                            │
               ▼                                            ▼
         State: Active ◄──────────────────────────── [ Correct Profile ]
```

### State Definitions
- **Pending Approval**: Initial signup state.
  - `role` is defaulted to `Employee` for safety.
  - `isApproved` is set to `false`.
  - Restricted from accessing any API endpoint except `/api/auth/me` and `/api/users/{id}/resubmit`.
  - Visualized on the client via the **Waiting For Approval** fullscreen lock.
- **Rejected**: Applications deemed invalid, incomplete, or incorrectly routed.
  - Holds `rejectionReason` string.
  - Exposes an interactive resubmission form. Resubmitting changes the state back to `Pending Approval`, resetting metadata and review timers.
- **Active**: Full system access corresponding to the assigned `role` is unlocked.

---

## 4. Role-Based Access Control (RBAC) & Permissions Matrix

Granular capabilities are checked via the client-side `PermissionService` and strictly checked on the backend via server-side middleware.

| Action / Capability | Admin | Asset Manager | Department Head | Employee |
| :--- | :---: | :---: | :---: | :---: |
| **VIEW_DASHBOARD** | ✅ | ✅ | ✅ | ✅ |
| **VIEW_ASSETS** | ✅ | ✅ | ✅ | ✅ |
| **MANAGE_ASSETS** (Create/Edit) | ✅ | ✅ | ❌ | ❌ |
| **VIEW_ALLOCATIONS** | ✅ | ✅ | ✅ | ❌ |
| **MANAGE_ALLOCATIONS** | ✅ | ✅ | ❌ | ❌ |
| **VIEW_BOOKINGS** | ✅ | ❌ | ✅ | ✅ |
| **MANAGE_BOOKINGS** | ✅ | ❌ | ✅ | ✅ |
| **VIEW_MAINTENANCE** | ✅ | ✅ | ✅ | ❌ |
| **MANAGE_MAINTENANCE** (Resolve) | ✅ | ✅ | ❌ | ❌ |
| **VIEW_AUDITS** | ✅ | ✅ | ✅ | ❌ |
| **MANAGE_AUDITS** (Verify) | ✅ | ✅ | ❌ | ❌ |
| **VIEW_REPORTS** (Analytics) | ✅ | ✅ | ❌ | ❌ |
| **VIEW_ORGANIZATION_SETUP** | ✅ | ❌ | ❌ | ❌ |
| **MANAGE_REGISTRATION_APPROVALS** | ✅ | ❌ | ❌ | ❌ |

---

## 5. API Reference & Data Transfer Objects (DTO)

All mock services mirror actual REST endpoints. The following endpoints must be mapped exactly when building the production controller.

### A. Authenticate User Session
*   **Endpoint**: `POST /api/auth/login`
*   **Request DTO**:
    ```typescript
    interface LoginRequestDto {
      usernameOrEmail: string;
      password?: string;
    }
    ```
*   **Response DTO (200 OK)**:
    ```typescript
    interface AuthResponseDto {
      success: boolean;
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        role: 'Admin' | 'Asset Manager' | 'Department Head' | 'Employee';
        status: 'Active' | 'Inactive' | 'Pending Approval' | 'Rejected';
        departmentId: string;
      };
    }
    ```

### B. Register New Account Request
*   **Endpoint**: `POST /api/auth/signup`
*   **Request DTO**:
    ```typescript
    interface SignupRequestDto {
      firstName: string;
      lastName: string;
      email: string;
      username: string;
      password?: string;
      departmentId: string;
      requestedRole: 'Employee' | 'Department Head' | 'Asset Manager';
    }
    ```
*   **Response DTO (201 Created)**:
    ```typescript
    interface SignupResponseDto {
      success: boolean;
      user: Employee; // status defaults to 'Pending Approval', role to 'Employee'
    }
    ```

### C. Issue 2FA OTP Code (Admin Only)
*   **Endpoint**: `POST /api/auth/admin/send-otp`
*   **Request DTO**:
    ```typescript
    interface SendOtpRequestDto {
      email: string;
    }
    ```
*   **Response DTO (200 OK)**:
    ```typescript
    interface SendOtpResponseDto {
      success: boolean;
      message: string; // "Verification code dispatched."
    }
    ```

### D. Verify 2FA OTP Code (Admin Only)
*   **Endpoint**: `POST /api/auth/admin/verify-otp`
*   **Request DTO**:
    ```typescript
    interface VerifyOtpRequestDto {
      email: string;
      otp: string;
    }
    ```
*   **Response DTO (200/400)**:
    ```typescript
    interface VerifyOtpResponseDto {
      success: boolean; // true if OTP matches and is unexpired
    }
    ```

### E. List Pending Registrations (Admin Restricted)
*   **Endpoint**: `GET /api/users/pending`
*   **Headers**: `Authorization: Bearer <Admin_JWT>`
*   **Response DTO (200 OK)**:
    ```typescript
    interface PendingUsersResponseDto {
      success: boolean;
      data: Employee[];
    }
    ```

### F. Approve and Activate Account (Admin Restricted)
*   **Endpoint**: `PUT /api/users/{id}/approve`
*   **Headers**: `Authorization: Bearer <Admin_JWT>`
*   **Request DTO**:
    ```typescript
    interface ApproveUserRequestDto {
      departmentId: string; // final approved department
      finalRole: 'Employee' | 'Department Head' | 'Asset Manager'; // final authorized role (can override requestedRole)
    }
    ```
*   **Response DTO (200 OK)**:
    ```typescript
    interface ApproveUserResponseDto {
      success: boolean;
      data: Employee; // status set to 'Active', isApproved to true
    }
    ```

### G. Deny & Reject Registration (Admin Restricted)
*   **Endpoint**: `PUT /api/users/{id}/reject`
*   **Headers**: `Authorization: Bearer <Admin_JWT>`
*   **Request DTO**:
    ```typescript
    interface RejectUserRequestDto {
      reason: string; // required rejection rationale
    }
    ```
*   **Response DTO (200 OK)**:
    ```typescript
    interface RejectUserResponseDto {
      success: boolean;
      data: Employee; // status set to 'Rejected', rejectionReason populated
    }
    ```

### H. Correct & Resubmit Application
*   **Endpoint**: `PUT /api/users/{id}/resubmit`
*   **Headers**: `Authorization: Bearer <JWT>`
*   **Request DTO**:
    ```typescript
    interface ResubmitRequestDto {
      firstName: string;
      lastName: string;
      email: string;
      username: string;
      departmentId: string;
      requestedRole: 'Employee' | 'Department Head' | 'Asset Manager';
    }
    ```
*   **Response DTO (200 OK)**:
    ```typescript
    interface ResubmitResponseDto {
      success: boolean;
      data: Employee; // resets status to 'Pending Approval', clears rejectionReason
    }
    ```
