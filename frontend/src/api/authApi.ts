import { apiClient } from './apiClient';
import { Employee, UserRole } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type?: string;
  user: Employee;
}

export interface SignupResponse {
  access_token?: string;
  user: Employee;
}

export const authApi = {
  login: async (usernameOrEmail: string, password?: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', {
      usernameOrEmail,
      password,
    });
    // Store JWT securely
    if (response.data.access_token) {
      localStorage.setItem('aureon_jwt_token', response.data.access_token);
      localStorage.setItem('aureon_currentUser', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  signup: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password?: string;
    departmentId: string;
    requestedRole: UserRole;
  }): Promise<SignupResponse> => {
    const response = await apiClient.post<SignupResponse>('/api/auth/signup', data);
    if (response.data.access_token) {
      localStorage.setItem('aureon_jwt_token', response.data.access_token);
      localStorage.setItem('aureon_currentUser', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post<{ success: boolean; message?: string }>('/api/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (data: any): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post<{ success: boolean; message?: string }>('/api/auth/reset-password', data);
    return response.data;
  },

  getMe: async (): Promise<Employee> => {
    const response = await apiClient.get<Employee>('/api/auth/me');
    localStorage.setItem('aureon_currentUser', JSON.stringify(response.data));
    return response.data;
  },

  getPendingUsers: async (): Promise<Employee[]> => {
    const response = await apiClient.get<Employee[]>('/api/users/pending');
    return response.data;
  },

  approveUser: async (userId: string, departmentId: string, finalRole: UserRole): Promise<Employee> => {
    const response = await apiClient.put<Employee>(`/api/users/${userId}/approve`, {
      departmentId,
      finalRole,
    });
    return response.data;
  },

  rejectUser: async (userId: string, reason: string): Promise<Employee> => {
    const response = await apiClient.put<Employee>(`/api/users/${userId}/reject`, {
      reason,
    });
    return response.data;
  },

  getUserProfile: async (userId: string): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/api/users/${userId}`);
    return response.data;
  },

  promoteEmployee: async (employeeId: string, newRole: UserRole): Promise<Employee> => {
    const response = await apiClient.put<Employee>(`/api/employees/${employeeId}/role`, {
      newRole,
    });
    return response.data;
  },

  resubmitApplication: async (userId: string, data: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    departmentId: string;
    requestedRole: UserRole;
  }): Promise<Employee> => {
    const response = await apiClient.put<Employee>(`/api/users/${userId}/resubmit`, data);
    localStorage.setItem('aureon_currentUser', JSON.stringify(response.data));
    return response.data;
  },
};
