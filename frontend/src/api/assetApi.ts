import { apiClient } from './apiClient';
import { Asset, AssetAllocation, TransferRequest, Department, AssetCategory } from '../types';

export interface AssetFilterOptions {
  search?: string;
  categoryId?: string;
  status?: string;
  location?: string;
  sharedBookable?: boolean;
}

export const assetApi = {
  // Departments
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

  // Categories
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

  // Assets
  getAssets: async (filters?: AssetFilterOptions): Promise<Asset[]> => {
    const response = await apiClient.get<Asset[]>('/api/assets', { params: filters });
    return response.data;
  },

  createAsset: async (data: Omit<Asset, 'id' | 'assetTag' | 'qrCodeUrl'>): Promise<Asset> => {
    const response = await apiClient.post<Asset>('/api/assets', data);
    return response.data;
  },

  updateAsset: async (id: string, data: Partial<Asset>): Promise<Asset> => {
    const response = await apiClient.put<Asset>(`/api/assets/${id}`, data);
    return response.data;
  },

  deleteAsset: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete<{ success: boolean }>(`/api/assets/${id}`);
    return response.data;
  },

  // Allocation / Return / Transfer
  allocateAsset: async (
    assetId: string,
    holderId: string,
    holderType: 'Employee' | 'Department',
    expectedReturnDate?: string
  ): Promise<AssetAllocation> => {
    const response = await apiClient.post<AssetAllocation>(`/api/assets/${assetId}/allocate`, {
      holderId,
      holderType,
      expectedReturnDate,
    });
    return response.data;
  },

  returnAsset: async (assetId: string, notes: string, condition: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>(`/api/assets/${assetId}/return`, {
      notes,
      condition,
    });
    return response.data;
  },

  requestTransfer: async (assetId: string, toEmployeeId: string, reason: string): Promise<TransferRequest> => {
    const response = await apiClient.post<TransferRequest>(`/api/assets/${assetId}/transfer`, {
      toEmployeeId,
      reason,
    });
    return response.data;
  },

  updateTransferStatus: async (transferId: string, status: 'Approved' | 'Rejected'): Promise<{ success: boolean }> => {
    const response = await apiClient.patch<{ success: boolean }>(`/api/transfers/${transferId}`, {
      status,
    });
    return response.data;
  },

  getTransferRequests: async (): Promise<TransferRequest[]> => {
    const response = await apiClient.get<TransferRequest[]>('/api/transfers');
    return response.data;
  },

  getAssetHistory: async (assetId: string): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/api/assets/${assetId}/history`);
    return response.data;
  },
};
