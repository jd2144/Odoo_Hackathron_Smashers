import { apiClient } from './apiClient';
import { UtilizationData, MaintenanceFrequencyData, DepartmentAllocationData, BookingHeatmapData } from '../services/report.service';

export const reportApi = {
  getDashboardStats: async (): Promise<any> => {
    const response = await apiClient.get<any>('/api/reports/dashboard');
    return response.data;
  },

  getAssetUtilization: async (): Promise<UtilizationData[]> => {
    const response = await apiClient.get<UtilizationData[]>('/api/reports/utilization');
    return response.data;
  },

  getMaintenanceFrequency: async (): Promise<MaintenanceFrequencyData[]> => {
    const response = await apiClient.get<MaintenanceFrequencyData[]>('/api/reports/maintenance-frequency');
    return response.data;
  },

  getDepartmentAllocation: async (): Promise<DepartmentAllocationData[]> => {
    const response = await apiClient.get<DepartmentAllocationData[]>('/api/reports/department-allocation');
    return response.data;
  },

  getBookingHeatmap: async (): Promise<BookingHeatmapData[]> => {
    const response = await apiClient.get<BookingHeatmapData[]>('/api/reports/booking-heatmap');
    return response.data;
  },

  getRetirementForecast: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/api/reports/retirement-forecast');
    return response.data;
  },

  exportAssets: async (): Promise<any> => {
    const response = await apiClient.get<any>('/api/reports/export/assets', { responseType: 'blob' });
    return response.data;
  },
};
