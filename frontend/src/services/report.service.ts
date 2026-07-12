import { MockDatabase } from './mockDb';

const DELAY = 500;

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
  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/reports/utilization
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: UtilizationData[]
  // }
  //
  // API endpoint name: Get Asset Utilization Report
  // Method: GET
  // Request DTO: None
  // Response DTO: UtilizationData[]
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getAssetUtilization: (): Promise<UtilizationData[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const assets = MockDatabase.getAssets();
        const categories = MockDatabase.getCategories();

        const data: UtilizationData[] = categories.map(cat => {
          const catAssets = assets.filter(a => a.categoryId === cat.id);
          const total = catAssets.length;
          const allocated = catAssets.filter(a => a.status === 'Allocated').length;
          const available = catAssets.filter(a => a.status === 'Available').length;
          const maintenance = catAssets.filter(a => a.status === 'Under Maintenance').length;

          const rate = total > 0 ? Math.round((allocated / total) * 100) : 0;

          return {
            category: cat.name,
            allocated,
            available,
            maintenance,
            total,
            rate
          };
        });

        resolve(data);
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/reports/maintenance-frequency
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: MaintenanceFrequencyData[]
  // }
  //
  // API endpoint name: Get Maintenance Frequency Report
  // Method: GET
  // Request DTO: None
  // Response DTO: MaintenanceFrequencyData[]
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getMaintenanceFrequency: (): Promise<MaintenanceFrequencyData[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const maintenance = MockDatabase.getMaintenance();
        const assets = MockDatabase.getAssets();
        const categories = MockDatabase.getCategories();

        const data: MaintenanceFrequencyData[] = categories.map(cat => {
          // Find asset IDs belonging to this category
          const catAssetIds = assets.filter(a => a.categoryId === cat.id).map(a => a.id);
          
          // Filter tickets for these assets
          const catTickets = maintenance.filter(t => catAssetIds.includes(t.assetId));
          const totalCost = catTickets.reduce((sum, t) => sum + (t.cost || 0), 0);

          return {
            categoryName: cat.name,
            ticketCount: catTickets.length,
            totalCost
          };
        });

        resolve(data);
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/reports/department-allocation
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: DepartmentAllocationData[]
  // }
  //
  // API endpoint name: Get Department Allocation Report
  // Method: GET
  // Request DTO: None
  // Response DTO: DepartmentAllocationData[]
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getDepartmentAllocation: (): Promise<DepartmentAllocationData[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const departments = MockDatabase.getDepartments();
        const assets = MockDatabase.getAssets();
        const employees = MockDatabase.getEmployees();

        const data: DepartmentAllocationData[] = departments.map(dept => {
          const deptEmployeeIds = employees.filter(e => e.departmentId === dept.id).map(e => e.id);
          const deptAssets = assets.filter(asset => {
            if (asset.currentHolderType === 'Department' && asset.currentHolderId === dept.id) {
              return true;
            }
            if (asset.currentHolderType === 'Employee' && asset.currentHolderId && deptEmployeeIds.includes(asset.currentHolderId)) {
              return true;
            }
            return false;
          });

          const totalValue = deptAssets.reduce((sum, a) => sum + a.acquisitionCost, 0);

          return {
            departmentName: dept.name,
            assetCount: deptAssets.length,
            totalValue
          };
        });

        resolve(data);
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/reports/booking-heatmap
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: BookingHeatmapData[]
  // }
  //
  // API endpoint name: Get Booking Heatmap Report
  // Method: GET
  // Request DTO: None
  // Response DTO: BookingHeatmapData[]
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getBookingHeatmap: (): Promise<BookingHeatmapData[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const bookings = MockDatabase.getBookings().filter(b => b.status !== 'Cancelled');
        
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        // Let's generate a distribution based on bookings or random but structured mock-ups
        const data: BookingHeatmapData[] = days.map((day, idx) => {
          // We can add some slight variations per day of the week
          const offset = idx % 2 === 0 ? 1 : 0;
          return {
            day,
            '08:00 - 10:00': 2 + offset,
            '10:00 - 12:00': 5 - offset,
            '12:00 - 14:00': 1 + offset,
            '14:00 - 16:00': 4 + offset,
            '16:00 - 18:00': 2 - offset
          };
        });

        resolve(data);
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/reports/retirement-forecast
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: any[]
  // }
  //
  // API endpoint name: Get Retirement Forecast Report
  // Method: GET
  // Request DTO: None
  // Response DTO: Array of Retirement Forecast items
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getRetirementForecast: (): Promise<any[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const assets = MockDatabase.getAssets();
        const categories = MockDatabase.getCategories();

        // Forecast assets that will need retirement in 2026/2027 based on condition (Fair/Poor/Broken) and age
        const nearingRetirement = assets.filter(a => 
          a.condition === 'Fair' || 
          a.condition === 'Poor' || 
          a.condition === 'Broken' ||
          a.status === 'Retired'
        );

        const data = nearingRetirement.map(a => {
          const cat = categories.find(c => c.id === a.categoryId);
          
          // Estimate retirement year
          let estimatedRetirementYear = 2026;
          if (a.condition === 'Poor' || a.condition === 'Broken') {
            estimatedRetirementYear = 2026;
          } else {
            estimatedRetirementYear = 2027;
          }

          return {
            id: a.id,
            assetTag: a.assetTag,
            name: a.name,
            category: cat ? cat.name : 'Unknown',
            condition: a.condition,
            cost: a.acquisitionCost,
            estimatedRetirementYear
          };
        });

        resolve(data);
      }, DELAY);
    });
  }
};
