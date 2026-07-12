import { AssetHistory } from '../types';
import { reportApi } from '../api/reportApi';
import { assetApi } from '../api/assetApi';

export interface DashboardStats {
  assetsAvailable: number;
  assetsAllocated: number;
  maintenanceToday: number;
  activeBookings: number;
  pendingTransfers: number;
  upcomingReturns: number;
  overdueReturnsCount: number;
}

export interface UpcomingReturnItem {
  id: string;
  assetTag: string;
  name: string;
  holderName: string;
  expectedReturnDate: string;
  isOverdue: boolean;
}

export interface DepartmentSummaryItem {
  id: string;
  name: string;
  totalAssets: number;
  totalValue: number;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      const data = await reportApi.getDashboardStats();
      // Map properties from API response, fallback to calculated stats if needed
      return {
        assetsAvailable: data.assetsAvailable ?? 0,
        assetsAllocated: data.assetsAllocated ?? 0,
        maintenanceToday: data.maintenanceToday ?? 0,
        activeBookings: data.activeBookings ?? 0,
        pendingTransfers: data.pendingTransfers ?? 0,
        upcomingReturns: data.upcomingReturns ?? 0,
        overdueReturnsCount: data.overdueReturnsCount ?? 0,
      };
    } catch {
      // Direct fallbacks by calling assets
      const assets = await assetApi.getAssets();
      const assetsAvailable = assets.filter(a => a.status === 'Available').length;
      const assetsAllocated = assets.filter(a => a.status === 'Allocated').length;
      return {
        assetsAvailable,
        assetsAllocated,
        maintenanceToday: 0,
        activeBookings: 0,
        pendingTransfers: 0,
        upcomingReturns: 0,
        overdueReturnsCount: 0,
      };
    }
  },

  getTimeline: async (limit = 10): Promise<AssetHistory[]> => {
    try {
      const response = await reportApi.getDashboardStats();
      return (response.timeline ?? []).slice(0, limit);
    } catch {
      return [];
    }
  },

  getDepartmentSummary: async (): Promise<DepartmentSummaryItem[]> => {
    try {
      const data = await reportApi.getDepartmentAllocation();
      return data.map((d: any) => ({
        id: d.id ?? d.departmentName,
        name: d.departmentName,
        totalAssets: d.assetCount,
        totalValue: d.totalValue
      }));
    } catch {
      return [];
    }
  },

  getUpcomingReturnsList: async (): Promise<UpcomingReturnItem[]> => {
    try {
      const data = await reportApi.getDashboardStats();
      return data.upcomingReturnsList ?? [];
    } catch {
      return [];
    }
  }
};
