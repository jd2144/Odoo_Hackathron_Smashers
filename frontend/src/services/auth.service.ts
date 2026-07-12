import { Employee, UserRole, EmployeeStatus } from '../types';
import { MockDatabase } from './mockDb';

const DELAY = 600;

export const authService = {
  // BACKEND API
  // Method: POST
  // Endpoint: /api/auth/login
  // Authentication: None (Public)
  // Request DTO: { usernameOrEmail: string, password?: string }
  // Response DTO: { success: boolean, data: Employee }
  // Expected Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden
  login: (usernameOrEmail: string, password?: string): Promise<Employee> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const employees = MockDatabase.getEmployees();
        const found = employees.find(
          e => e.email.toLowerCase() === usernameOrEmail.toLowerCase() ||
               (e.username && e.username.toLowerCase() === usernameOrEmail.toLowerCase())
        );
        
        if (found) {
          if (found.status === 'Inactive') {
            reject(new Error('This user account is inactive. Please contact your system administrator.'));
            return;
          }
          // Check password (initial users have 'password' as default)
          const expectedPassword = found.password || 'password';
          if (password && password !== expectedPassword && password !== '••••••••') {
            reject(new Error('Invalid password provided.'));
            return;
          }

          // For pending or rejected users, we still allow login but routing guards will block them to special views
          MockDatabase.setCurrentUser(found);
          MockDatabase.logAction(found.id, found.name, 'Auth Login', `Successfully logged into Aureon ERP as ${found.role}.`);
          resolve(found);
        } else {
          reject(new Error('Invalid username or email address.'));
        }
      }, DELAY);
    });
  },

  // BACKEND API
  // Method: POST
  // Endpoint: /api/auth/logout
  // Authentication: JWT Required
  // Request DTO: None
  // Response DTO: { success: boolean }
  // Expected Status Codes: 200 OK, 401 Unauthorized
  logout: (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentUser = MockDatabase.getCurrentUser();
        if (currentUser) {
          MockDatabase.logAction(currentUser.id, currentUser.name, 'Auth Logout', `Successfully logged out.`);
        }
        MockDatabase.setCurrentUser(null);
        resolve();
      }, 400);
    });
  },

  // BACKEND API
  // Method: POST
  // Endpoint: /api/auth/signup
  // Authentication: None (Public)
  // Request DTO: { firstName: string, lastName: string, email: string, username: string, password?: string, departmentId: string, requestedRole: UserRole }
  // Response DTO: { success: boolean, data: Employee }
  // Expected Status Codes: 201 Created, 400 Bad Request, 409 Conflict
  signup: (data: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password?: string;
    departmentId: string;
    requestedRole: UserRole;
  }): Promise<Employee> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const employees = MockDatabase.getEmployees();
        
        const emailExists = employees.some(e => e.email.toLowerCase() === data.email.toLowerCase());
        if (emailExists) {
          reject(new Error('An account with this email address already exists.'));
          return;
        }

        const usernameExists = employees.some(e => e.username && e.username.toLowerCase() === data.username.toLowerCase());
        if (usernameExists) {
          reject(new Error('An account with this username already exists.'));
          return;
        }

        const newEmployee: Employee = {
          id: MockDatabase.generateId('emp'),
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          username: data.username,
          password: data.password || 'password',
          departmentId: data.departmentId,
          role: 'Employee', // Actual role default is Employee
          requestedRole: data.requestedRole,
          status: 'Pending Approval',
          isApproved: false,
          registrationDate: new Date().toISOString(),
          estimatedReviewTime: '24-48 hours',
          avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80`
        };

        const updated = [...employees, newEmployee];
        MockDatabase.saveEmployees(updated);
        MockDatabase.setCurrentUser(newEmployee); // set pending user session to let them view pending screen
        
        MockDatabase.logAction(newEmployee.id, newEmployee.name, 'Auth Signup', `Registered pending account requesting role: ${data.requestedRole}`);
        MockDatabase.addNotification(
          'Account Registered', 
          `Your pending account has been registered. Welcome aboard, ${newEmployee.name}!`, 
          'Asset Assigned'
        );

        resolve(newEmployee);
      }, DELAY);
    });
  },

  // BACKEND API
  // Method: GET
  // Endpoint: /api/auth/me
  // Authentication: JWT Required
  // Request DTO: None
  // Response DTO: { success: boolean, data: Employee | null }
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getCurrentUser: (): Promise<Employee | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MockDatabase.getCurrentUser());
      }, 200);
    });
  },

  // BACKEND API
  // Method: POST
  // Endpoint: /api/auth/admin/send-otp
  // Authentication: None (Public)
  // Request DTO: { email: string }
  // Response DTO: { success: boolean, msg: string }
  // Expected Status Codes: 200 OK, 404 Not Found, 403 Forbidden (Non-admins trying 2FA)
  sendOTP: (email: string): Promise<{ success: boolean; otp: string }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const employees = MockDatabase.getEmployees();
        const found = employees.find(e => e.email.toLowerCase() === email.toLowerCase());
        
        if (!found) {
          reject(new Error('Email address not registered.'));
          return;
        }

        if (found.role !== 'Admin') {
          reject(new Error('Access denied. OTP 2FA is restricted to system administrators.'));
          return;
        }

        // Generate mock 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        localStorage.setItem(`aureon_otp_${email.toLowerCase()}`, otpCode);
        
        console.log(`[MOCK EMAIL SMTP SERVICE] OTP Code sent to ${email}: ${otpCode}`);
        resolve({ success: true, otp: otpCode });
      }, DELAY);
    });
  },

  // BACKEND API
  // Method: POST
  // Endpoint: /api/auth/admin/verify-otp
  // Authentication: None (Public)
  // Request DTO: { email: string, otp: string }
  // Response DTO: { success: boolean }
  // Expected Status Codes: 200 OK, 400 Bad Request
  verifyOTP: (email: string, otp: string): Promise<{ success: boolean }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const storedOtp = localStorage.getItem(`aureon_otp_${email.toLowerCase()}`);
        if (storedOtp && storedOtp === otp) {
          localStorage.removeItem(`aureon_otp_${email.toLowerCase()}`);
          resolve({ success: true });
        } else {
          reject(new Error('Invalid 2FA Verification code.'));
        }
      }, DELAY);
    });
  },

  // BACKEND API
  // Method: GET
  // Endpoint: /api/users/pending
  // Authentication: JWT Required (Admin Only)
  // Request DTO: None
  // Response DTO: { success: boolean, data: Employee[] }
  // Expected Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden
  getPendingUsers: (): Promise<Employee[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const employees = MockDatabase.getEmployees();
        const pending = employees.filter(e => e.status === 'Pending Approval');
        resolve(pending);
      }, DELAY);
    });
  },

  // BACKEND API
  // Method: PUT
  // Endpoint: /api/users/{id}/approve
  // Authentication: JWT Required (Admin Only)
  // Request DTO: { departmentId: string, finalRole: UserRole }
  // Response DTO: { success: boolean, data: Employee }
  // Expected Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found
  approveUser: (userId: string, departmentId: string, finalRole: UserRole): Promise<Employee> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const employees = MockDatabase.getEmployees();
        const index = employees.findIndex(e => e.id === userId);
        if (index === -1) {
          reject(new Error('User not found.'));
          return;
        }

        const employee = employees[index];
        const updatedUser: Employee = {
          ...employee,
          status: 'Active',
          role: finalRole,
          departmentId,
          isApproved: true,
          rejectionReason: undefined
        };

        const updatedList = [...employees];
        updatedList[index] = updatedUser;
        MockDatabase.saveEmployees(updatedList);

        // Audit Logging
        const currentAdmin = MockDatabase.getCurrentUser();
        if (currentAdmin) {
          MockDatabase.logAction(
            currentAdmin.id,
            currentAdmin.name,
            'Account Approve',
            `Approved ${employee.name} with role ${finalRole} in department ${departmentId}`
          );
        }

        // Add user-specific notification
        const notificationsJson = localStorage.getItem(`aureon_notifications_${userId}`) || '[]';
        const userNotifs = JSON.parse(notificationsJson);
        userNotifs.push({
          id: MockDatabase.generateId('n'),
          title: 'Account Activated',
          message: `Your account has been approved by Admin. Your access level is now ${finalRole}.`,
          type: 'Asset Assigned',
          isRead: false,
          createdDate: new Date().toISOString()
        });
        localStorage.setItem(`aureon_notifications_${userId}`, JSON.stringify(userNotifs));

        resolve(updatedUser);
      }, DELAY);
    });
  },

  // BACKEND API
  // Method: PUT
  // Endpoint: /api/users/{id}/reject
  // Authentication: JWT Required (Admin Only)
  // Request DTO: { reason: string }
  // Response DTO: { success: boolean, data: Employee }
  // Expected Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found
  rejectUser: (userId: string, reason: string): Promise<Employee> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const employees = MockDatabase.getEmployees();
        const index = employees.findIndex(e => e.id === userId);
        if (index === -1) {
          reject(new Error('User not found.'));
          return;
        }

        const employee = employees[index];
        const updatedUser: Employee = {
          ...employee,
          status: 'Rejected',
          isApproved: false,
          rejectionReason: reason
        };

        const updatedList = [...employees];
        updatedList[index] = updatedUser;
        MockDatabase.saveEmployees(updatedList);

        // Audit Logging
        const currentAdmin = MockDatabase.getCurrentUser();
        if (currentAdmin) {
          MockDatabase.logAction(
            currentAdmin.id,
            currentAdmin.name,
            'Account Reject',
            `Rejected ${employee.name}. Reason: ${reason}`
          );
        }

        resolve(updatedUser);
      }, DELAY);
    });
  },

  // BACKEND API
  // Method: GET
  // Endpoint: /api/users/{id}
  // Authentication: JWT Required
  // Request DTO: None
  // Response DTO: { success: boolean, data: Employee }
  // Expected Status Codes: 200 OK, 401 Unauthorized, 404 Not Found
  getUserProfile: (userId: string): Promise<Employee> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const employees = MockDatabase.getEmployees();
        const found = employees.find(e => e.id === userId);
        if (found) {
          resolve(found);
        } else {
          reject(new Error('User profile not found.'));
        }
      }, 200);
    });
  },

  // BACKEND API
  // Method: PUT
  // Endpoint: /api/employees/:id/role
  // Authentication: JWT Required (Admin only)
  // Expected Response: { success: true, data: Employee }
  promoteEmployee: (adminId: string, employeeId: string, newRole: UserRole): Promise<Employee> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const employees = MockDatabase.getEmployees();
        const admin = employees.find(e => e.id === adminId);
        if (!admin || admin.role !== 'Admin') {
          reject(new Error('Permission denied. Only Admins can promote employees.'));
          return;
        }

        const targetIndex = employees.findIndex(e => e.id === employeeId);
        if (targetIndex === -1) {
          reject(new Error('Employee not found.'));
          return;
        }

        const target = employees[targetIndex];
        const updatedTarget = { ...target, role: newRole };
        const updatedList = [...employees];
        updatedList[targetIndex] = updatedTarget;
        
        MockDatabase.saveEmployees(updatedList);
        MockDatabase.logAction(admin.id, admin.name, 'Role Promotion', `Promoted ${target.name} to ${newRole}`);
        MockDatabase.addNotification(
          'Role Upgraded',
          `Your role in the organization has been updated to ${newRole}.`,
          'Asset Assigned'
        );

        resolve(updatedTarget);
      }, DELAY);
    });
  },

  // BACKEND API
  // Method: PUT
  // Endpoint: /api/users/{id}/resubmit
  // Authentication: JWT Required
  // Request DTO: { firstName: string, lastName: string, email: string, username: string, departmentId: string, requestedRole: UserRole }
  // Response DTO: { success: boolean, data: Employee }
  // Expected Status Codes: 200 OK, 400 Bad Request
  resubmitApplication: (userId: string, data: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    departmentId: string;
    requestedRole: UserRole;
  }): Promise<Employee> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const employees = MockDatabase.getEmployees();
        const index = employees.findIndex(e => e.id === userId);
        if (index === -1) {
          reject(new Error('User not found.'));
          return;
        }

        const employee = employees[index];
        const updatedUser: Employee = {
          ...employee,
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          username: data.username,
          departmentId: data.departmentId,
          requestedRole: data.requestedRole,
          status: 'Pending Approval',
          isApproved: false,
          rejectionReason: undefined,
          registrationDate: new Date().toISOString()
        };

        const updatedList = [...employees];
        updatedList[index] = updatedUser;
        MockDatabase.saveEmployees(updatedList);
        MockDatabase.setCurrentUser(updatedUser);

        MockDatabase.logAction(userId, updatedUser.name, 'Auth Resubmit', `Resubmitted application requesting: ${data.requestedRole}`);
        resolve(updatedUser);
      }, DELAY);
    });
  }
};
