import { MaintenanceRequest, MaintenanceStatus } from '../types';
import { maintenanceApi } from '../api/maintenanceApi';

export const maintenanceService = {
  getMaintenanceRequests: async (): Promise<MaintenanceRequest[]> => {
    return await maintenanceApi.getMaintenanceRequests();
  },

  createMaintenanceRequest: async (
    assetId: string, 
    description: string, 
    priority: MaintenanceRequest['priority'],
    photoUrl?: string
  ): Promise<MaintenanceRequest> => {
    return await maintenanceApi.createMaintenanceRequest(assetId, description, priority, photoUrl);
  },

  updateRequestStatus: async (
    requestId: string, 
    status: MaintenanceStatus, 
    updates?: { technicianName?: string; notes?: string; cost?: number }
  ): Promise<MaintenanceRequest> => {
    return await maintenanceApi.updateRequestStatus(requestId, status, updates);
  }
};
