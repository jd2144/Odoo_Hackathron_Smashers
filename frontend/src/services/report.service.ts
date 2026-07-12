import { reportApi } from '../api/reportApi';

export interface UtilizationData {
  category: string;
  allocated: number;
  available: number;
  maintenance: number;
  total: number;
  rate: number; // percentage
}

export interface MaintenanceFrequencyData {
  categoryName: string;
  ticketCount: number;
  totalCost: number;
}

export interface DepartmentAllocationData {
  departmentName: string;
  assetCount: number;
  totalValue: number;
}

export interface BookingHeatmapData {
  day: string;
  '08:00 - 10:00': number;
  '10:00 - 12:00': number;
  '12:00 - 14:00': number;
  '14:00 - 16:00': number;
  '16:00 - 18:00': number;
}

export const reportService = {
  getAssetUtilization: async (): Promise<UtilizationData[]> => {
    return await reportApi.getAssetUtilization();
  },

  getMaintenanceFrequency: async (): Promise<MaintenanceFrequencyData[]> => {
    return await reportApi.getMaintenanceFrequency();
  },

  getDepartmentAllocation: async (): Promise<DepartmentAllocationData[]> => {
    return await reportApi.getDepartmentAllocation();
  },

  getBookingHeatmap: async (): Promise<BookingHeatmapData[]> => {
    return await reportApi.getBookingHeatmap();
  },

  getRetirementForecast: async (): Promise<any[]> => {
    return await reportApi.getRetirementForecast();
  }
};
