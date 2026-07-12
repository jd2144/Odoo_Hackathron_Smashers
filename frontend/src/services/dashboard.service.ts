import { MockDatabase } from './mockDb';
import { AssetHistory } from '../types';

const DELAY = 500;

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
  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/dashboard/stats
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: DashboardStats
  // }
  //
  // API endpoint name: Get Dashboard Statistics
  // Method: GET
  // Request DTO: None
  // Response DTO: DashboardStats
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getStats: (): Promise<DashboardStats> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const assets = MockDatabase.getAssets();
        const bookings = MockDatabase.getBookings();
        const maintenance = MockDatabase.getMaintenance();
        const transfers = MockDatabase.getTransfers();
        const allocations = MockDatabase.getAllocations();

        const todayStr = new Date().toISOString().split('T')[0];

        const assetsAvailable = assets.filter(a => a.status === 'Available').length;
        const assetsAllocated = assets.filter(a => a.status === 'Allocated').length;
        const maintenanceToday = maintenance.filter(m => m.status === 'Pending' || m.status === 'In Progress').length;
        const activeBookings = bookings.filter(b => b.status === 'Upcoming' || b.status === 'Ongoing').length;
        const pendingTransfers = transfers.filter(t => t.status === 'Pending').length;

        // Count allocations
        let upcomingReturns = 0;
        let overdueReturnsCount = 0;

        allocations.forEach(alc => {
          if (alc.status === 'Active' || alc.status === 'Overdue') {
            if (alc.expectedReturnDate) {
              if (alc.expectedReturnDate < todayStr) {
                overdueReturnsCount++;
              } else {
                upcomingReturns++;
              }
            }
          }
        });

        resolve({
          assetsAvailable,
          assetsAllocated,
          maintenanceToday,
          activeBookings,
          pendingTransfers,
          upcomingReturns,
          overdueReturnsCount
        });
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/dashboard/timeline
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: AssetHistory[]
  // }
  //
  // API endpoint name: Get Dashboard Action Timeline
  // Method: GET
  // Request DTO: { limit?: number } (Query param)
  // Response DTO: AssetHistory[]
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getTimeline: (limit = 10): Promise<AssetHistory[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const history = MockDatabase.getHistory();
        // Sort newest first
        const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(sorted.slice(0, limit));
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/dashboard/departments-summary
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: DepartmentSummaryItem[]
  // }
  //
  // API endpoint name: Get Department Summary
  // Method: GET
  // Request DTO: None
  // Response DTO: DepartmentSummaryItem[]
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getDepartmentSummary: (): Promise<DepartmentSummaryItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const departments = MockDatabase.getDepartments();
        const assets = MockDatabase.getAssets();
        const employees = MockDatabase.getEmployees();

        const summary: DepartmentSummaryItem[] = departments.map(dept => {
          // Find employees in department
          const deptEmployeeIds = employees.filter(e => e.departmentId === dept.id).map(e => e.id);
          
          // Find assets held by those employees or directly by the department
          const deptAssets = assets.filter(asset => {
            if (asset.currentHolderType === 'Department' && asset.currentHolderId === dept.id) {
              return true;
            }
            if (asset.currentHolderType === 'Employee' && asset.currentHolderId && deptEmployeeIds.includes(asset.currentHolderId)) {
              return true;
            }
            return false;
          });

          const totalValue = deptAssets.reduce((sum, current) => sum + current.acquisitionCost, 0);

          return {
            id: dept.id,
            name: dept.name,
            totalAssets: deptAssets.length,
            totalValue
          };
        });

        resolve(summary);
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/dashboard/upcoming-returns
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: UpcomingReturnItem[]
  // }
  //
  // API endpoint name: Get Upcoming Return Items
  // Method: GET
  // Request DTO: None
  // Response DTO: UpcomingReturnItem[]
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getUpcomingReturnsList: (): Promise<UpcomingReturnItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allocations = MockDatabase.getAllocations();
        const assets = MockDatabase.getAssets();
        const employees = MockDatabase.getEmployees();
        const todayStr = new Date().toISOString().split('T')[0];

        const list: UpcomingReturnItem[] = [];

        allocations.forEach(alc => {
          if ((alc.status === 'Active' || alc.status === 'Overdue') && alc.expectedReturnDate) {
            const asset = assets.find(a => a.id === alc.assetId);
            if (!asset) return;

            let holderName = 'Department Allocation';
            if (alc.employeeId) {
              const emp = employees.find(e => e.id === alc.employeeId);
              if (emp) holderName = emp.name;
            }

            const isOverdue = alc.expectedReturnDate < todayStr;

            list.push({
              id: alc.id,
              assetTag: asset.assetTag,
              name: asset.name,
              holderName,
              expectedReturnDate: alc.expectedReturnDate,
              isOverdue
            });
          }
        });

        // Sort overdue first, then nearest expected date
        list.sort((a, b) => {
          if (a.isOverdue && !b.isOverdue) return -1;
          if (!a.isOverdue && b.isOverdue) return 1;
          return new Date(a.expectedReturnDate).getTime() - new Date(b.expectedReturnDate).getTime();
        });

        resolve(list);
      }, DELAY);
    });
  }
};
