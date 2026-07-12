import { 
  Asset, 
  AssetHistory, 
  AssetAllocation, 
  TransferRequest, 
  Department, 
  AssetCategory, 
  Employee,
  AssetStatus,
  AssetCondition,
  UserRole
} from '../types';
import { assetApi } from '../api/assetApi';
import { organizationApi } from '../api/organizationApi';

export interface AssetFilterOptions {
  search?: string;
  categoryId?: string;
  status?: string;
  location?: string;
  sharedBookable?: boolean;
}


export const assetService = {
  getDepartments: async (): Promise<Department[]> => {
    return await organizationApi.getDepartments();
  },

  createDepartment: async (deptData: Omit<Department, 'id' | 'createdAt'>): Promise<Department> => {
    return await organizationApi.createDepartment(deptData);
  },

  updateDepartment: async (id: string, updates: Partial<Department>): Promise<Department> => {
    return await organizationApi.updateDepartment(id, updates);
  },

  getCategories: async (): Promise<AssetCategory[]> => {
    return await organizationApi.getCategories();
  },

  createCategory: async (catData: Omit<AssetCategory, 'id'>): Promise<AssetCategory> => {
    return await organizationApi.createCategory(catData);
  },

  getEmployees: async (): Promise<Employee[]> => {
    return await organizationApi.getEmployees();
  },

  updateEmployeeRole: async (employeeId: string, role: UserRole, status: 'Active' | 'Inactive', departmentId?: string): Promise<Employee> => {
    // Both role and other updates can be sent
    const updated = await organizationApi.updateEmployeeRole(employeeId, role);
    return updated;
  },

  getAssets: async (filters?: AssetFilterOptions): Promise<Asset[]> => {
    return await assetApi.getAssets(filters);
  },

  getAssetById: async (id: string): Promise<Asset | null> => {
    const assets = await assetApi.getAssets();
    return assets.find(a => a.id === id) || null;
  },

  getAssetHistory: async (assetId: string): Promise<AssetHistory[]> => {
    return await assetApi.getAssetHistory(assetId);
  },

  registerAsset: async (assetData: Omit<Asset, 'id' | 'assetTag' | 'qrCodeUrl'>): Promise<Asset> => {
    return await assetApi.createAsset(assetData);
  },

  updateAsset: async (id: string, updates: Partial<Asset>): Promise<Asset> => {
    return await assetApi.updateAsset(id, updates);
  },

  deleteAsset: async (id: string): Promise<{ success: boolean }> => {
    return await assetApi.deleteAsset(id);
  },

  allocateAsset: async (
    assetId: string, 
    holderId: string, 
    holderType: 'Employee' | 'Department', 
    expectedReturnDate?: string
  ): Promise<AssetAllocation> => {
    return await assetApi.allocateAsset(assetId, holderId, holderType, expectedReturnDate);
  },

  returnAsset: async (assetId: string, notes: string, condition: AssetCondition): Promise<void> => {
    await assetApi.returnAsset(assetId, notes, condition);
  },

  getTransfers: async (): Promise<TransferRequest[]> => {
    return await assetApi.getTransferRequests();
  },

  requestTransfer: async (assetId: string, toEmployeeId: string, reason: string): Promise<TransferRequest> => {
    return await assetApi.requestTransfer(assetId, toEmployeeId, reason);
  },

  approveTransfer: async (transferId: string): Promise<void> => {
    await assetApi.updateTransferStatus(transferId, 'Approved');
  },

  rejectTransfer: async (transferId: string): Promise<void> => {
    await assetApi.updateTransferStatus(transferId, 'Rejected');
  }
};
