import { Employee, UserRole } from '../types';
import { authApi } from '../api/authApi';

export const authService = {
  login: async (usernameOrEmail: string, password?: string): Promise<Employee> => {
    const result = await authApi.login(usernameOrEmail, password);
    return result.user;
  },

  logout: async (): Promise<void> => {
    // Standard backend logout, can just clear token and call api if needed
    localStorage.removeItem('aureon_jwt_token');
    localStorage.removeItem('aureon_currentUser');
  },

  signup: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password?: string;
    departmentId: string;
    requestedRole: UserRole;
  }): Promise<Employee> => {
    const result = await authApi.signup(data);
    return result.user;
  },

  getCurrentUser: async (): Promise<Employee | null> => {
    try {
      return await authApi.getMe();
    } catch {
      const stored = localStorage.getItem('aureon_currentUser');
      return stored ? JSON.parse(stored) : null;
    }
  },

  sendOTP: async (email: string): Promise<{ success: boolean; otp: string }> => {
    // Delegate to public OTP / 2FA or signin steps if configured
    const response = await authApi.forgotPassword(email);
    return { success: response.success, otp: '' };
  },

  getPendingUsers: async (): Promise<Employee[]> => {
    return await authApi.getPendingUsers();
  },

  approveUser: async (userId: string, departmentId: string, finalRole: UserRole): Promise<Employee> => {
    return await authApi.approveUser(userId, departmentId, finalRole);
  },

  getUserProfile: async (userId: string): Promise<Employee> => {
    return await authApi.getUserProfile(userId);
  },

  getEmployees: async (): Promise<Employee[]> => {
    // From organizationApi
    const { organizationApi } = await import('../api/organizationApi');
    return await organizationApi.getEmployees();
  },

  promoteEmployee: async (adminId: string, employeeId: string, newRole: UserRole): Promise<Employee> => {
    // The adminId isn't needed by the real backend because user context is in JWT
    return await authApi.promoteEmployee(employeeId, newRole);
  },

  resubmitApplication: async (userId: string, data: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    departmentId: string;
    requestedRole: UserRole;
  }): Promise<Employee> => {
    return await authApi.resubmitApplication(userId, data);
  }
};
