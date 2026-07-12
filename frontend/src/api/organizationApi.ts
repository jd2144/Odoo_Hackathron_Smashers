import { apiClient } from './apiClient';
import { Department, AssetCategory, Employee, UserRole } from '../types';

export const organizationApi = {
  getDepartments: async (): Promise<Department[]> => {
    const response = await apiClient.get<Department[]>('/api/departments');
    return response.data;
  },

  createDepartment: async (data: Omit<Department, 'id' | 'createdAt'>): Promise<Department> => {
    const response = await apiClient.post<Department>('/api/departments', data);
    return response.data;
  },

  updateDepartment: async (id: string, data: Partial<Department>): Promise<Department> => {
    const response = await apiClient.put<Department>(`/api/departments/${id}`, data);
    return response.data;
  },

  getCategories: async (): Promise<AssetCategory[]> => {
    const response = await apiClient.get<AssetCategory[]>('/api/categories');
    return response.data;
  },

  createCategory: async (data: Omit<AssetCategory, 'id'>): Promise<AssetCategory> => {
    const response = await apiClient.post<AssetCategory>('/api/categories', data);
    return response.data;
  },

  updateCategory: async (id: string, data: Partial<AssetCategory>): Promise<AssetCategory> => {
    const response = await apiClient.put<AssetCategory>(`/api/categories/${id}`, data);
    return response.data;
  },

  getEmployees: async (): Promise<Employee[]> => {
    const response = await apiClient.get<Employee[]>('/api/employees');
    return response.data;
  },

  updateEmployeeRole: async (employeeId: string, newRole: UserRole): Promise<Employee> => {
    const response = await apiClient.put<Employee>(`/api/employees/${employeeId}/role`, {
      newRole,
    });
    return response.data;
  },
};
