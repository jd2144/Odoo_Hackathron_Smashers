import { apiClient } from './apiClient';
import { MaintenanceRequest, MaintenanceStatus } from '../types';

export const maintenanceApi = {
  getMaintenanceRequests: async (): Promise<MaintenanceRequest[]> => {
    const response = await apiClient.get<MaintenanceRequest[]>('/api/maintenance');
    return response.data;
  },

  createMaintenanceRequest: async (
    assetId: string,
    description: string,
    priority: MaintenanceRequest['priority'],
    photoUrl?: string
  ): Promise<MaintenanceRequest> => {
    const response = await apiClient.post<MaintenanceRequest>('/api/maintenance', {
      assetId,
      description,
      priority,
      photoUrl,
    });
    return response.data;
  },

  updateRequestStatus: async (
    requestId: string,
    status: MaintenanceStatus,
    updates?: { technicianName?: string; notes?: string; cost?: number }
  ): Promise<MaintenanceRequest> => {
    // Both PUT or PATCH might be defined, we can call PATCH or PUT
    const response = await apiClient.patch<MaintenanceRequest>(`/api/maintenance/${requestId}`, {
      status,
      ...updates,
    });
    return response.data;
  },
};
