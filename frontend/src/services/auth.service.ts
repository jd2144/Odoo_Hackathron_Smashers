import { Employee, UserRole } from '../types';
import { MockDatabase } from './mockDb';

const DELAY = 600;

export const authService = {
  // BACKEND API
  //
  // Method: POST
  //
  // Endpoint: /api/auth/login
  //
  // Authentication: None (Public)
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: Employee
  // }
  //
  // API endpoint name: User Login
  // Method: POST
  // Request DTO: { email: string, password?: string }
  // Response DTO: Employee
  // Expected Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized
  login: (email: string, password?: string): Promise<Employee> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const employees = MockDatabase.getEmployees();
        const found = employees.find(e => e.email.toLowerCase() === email.toLowerCase());
        
        if (found) {
          if (found.status === 'Inactive') {
            reject(new Error('This user account is inactive. Please contact your system administrator.'));
            return;
          }
          MockDatabase.setCurrentUser(found);
          MockDatabase.logAction(found.id, found.name, 'Auth Login', `Successfully logged into AssetFlow.`);
          resolve(found);
        } else {
          // If the user doesn't exist, we'll let them login as john doe or admin if matching emails,
          // otherwise throw standard error.
          reject(new Error('Invalid email or password.'));
        }
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: POST
  //
  // Endpoint: /api/auth/logout
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: null
  // }
  //
  // API endpoint name: User Logout
  // Method: POST
  // Request DTO: None
  // Response DTO: None (void)
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
  //
  // Method: POST
  //
  // Endpoint: /api/auth/signup
  //
  // Authentication: None (Public)
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: Employee
  // }
  //
  // API endpoint name: User Signup
  // Method: POST
  // Request DTO: { name: string, email: string }
  // Response DTO: Employee
  // Expected Status Codes: 201 Created, 400 Bad Request, 409 Conflict
  signup: (name: string, email: string): Promise<Employee> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const employees = MockDatabase.getEmployees();
        const exists = employees.some(e => e.email.toLowerCase() === email.toLowerCase());
        
        if (exists) {
          reject(new Error('An account with this email address already exists.'));
          return;
        }

        const newEmployee: Employee = {
          id: MockDatabase.generateId('emp'),
          name,
          email,
          role: 'Employee', // Strict: Default role is always Employee. No self-promoting.
          status: 'Active',
          avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80` // standard avatar
        };

        const updated = [...employees, newEmployee];
        MockDatabase.saveEmployees(updated);
        MockDatabase.setCurrentUser(newEmployee);
        
        MockDatabase.logAction(newEmployee.id, newEmployee.name, 'Auth Signup', 'Created new Employee account.');
        MockDatabase.addNotification(
          'Welcome to AssetFlow!', 
          `Your Employee account has been registered. Welcome aboard, ${name}!`, 
          'Asset Assigned'
        );

        resolve(newEmployee);
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/auth/me
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: Employee | null
  // }
  //
  // API endpoint name: Get Current Authenticated User
  // Method: GET
  // Request DTO: None
  // Response DTO: Employee | null
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getCurrentUser: (): Promise<Employee | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MockDatabase.getCurrentUser());
      }, 200);
    });
  },

  // BACKEND API
  //
  // Method: PUT
  //
  // Endpoint: /api/employees/:id/role
  //
  // Authentication: JWT Required (Admin only)
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: Employee
  // }
  //
  // API endpoint name: Promote Employee Role (Alternate API)
  // Method: PUT
  // Request DTO: { newRole: UserRole }
  // Response DTO: Employee
  // Expected Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
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
  }
};
