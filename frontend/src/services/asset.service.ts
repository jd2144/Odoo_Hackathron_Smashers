import { MockDatabase } from './mockDb';
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

const DELAY = 600;

export interface AssetFilterOptions {
  search?: string;
  categoryId?: string;
  status?: AssetStatus;
  location?: string;
  sharedBookable?: boolean;
}

export const assetService = {
  // MASTER DATA MANAGEMENT

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/departments
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: Department[]
  // }
  //
  // API endpoint name: Get Departments
  // Method: GET
  // Request DTO: None
  // Response DTO: Department[]
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getDepartments: (): Promise<Department[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MockDatabase.getDepartments()), 300);
    });
  },

  // BACKEND API
  //
  // Method: POST
  //
  // Endpoint: /api/departments
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: Department
  // }
  //
  // API endpoint name: Create Department
  // Method: POST
  // Request DTO: Omit<Department, 'id' | 'createdAt'>
  // Response DTO: Department
  // Expected Status Codes: 201 Created, 400 Bad Request, 401 Unauthorized
  createDepartment: (deptData: Omit<Department, 'id' | 'createdAt'>): Promise<Department> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const depts = MockDatabase.getDepartments();
        const newDept: Department = {
          ...deptData,
          id: MockDatabase.generateId('dep'),
          createdAt: new Date().toISOString()
        };
        MockDatabase.saveDepartments([...depts, newDept]);

        // Log audit trail
        const user = MockDatabase.getCurrentUser();
        if (user) {
          MockDatabase.logAction(user.id, user.name, 'Create Department', `Created department: ${newDept.name}`);
        }
        resolve(newDept);
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: PUT
  //
  // Endpoint: /api/departments/:id
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: Department
  // }
  //
  // API endpoint name: Update Department
  // Method: PUT
  // Request DTO: Partial<Department>
  // Response DTO: Department
  // Expected Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized, 404 Not Found
  updateDepartment: (id: string, updates: Partial<Department>): Promise<Department> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const depts = MockDatabase.getDepartments();
        const index = depts.findIndex(d => d.id === id);
        if (index === -1) {
          reject(new Error('Department not found.'));
          return;
        }
        const updated = { ...depts[index], ...updates };
        const updatedList = [...depts];
        updatedList[index] = updated;
        MockDatabase.saveDepartments(updatedList);

        const user = MockDatabase.getCurrentUser();
        if (user) {
          MockDatabase.logAction(user.id, user.name, 'Update Department', `Updated department: ${updated.name}`);
        }
        resolve(updated);
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/categories
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: AssetCategory[]
  // }
  //
  // API endpoint name: Get Categories
  // Method: GET
  // Request DTO: None
  // Response DTO: AssetCategory[]
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getCategories: (): Promise<AssetCategory[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MockDatabase.getCategories()), 300);
    });
  },

  // BACKEND API
  //
  // Method: POST
  //
  // Endpoint: /api/categories
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: AssetCategory
  // }
  //
  // API endpoint name: Create Category
  // Method: POST
  // Request DTO: Omit<AssetCategory, 'id'>
  // Response DTO: AssetCategory
  // Expected Status Codes: 201 Created, 400 Bad Request, 401 Unauthorized
  createCategory: (catData: Omit<AssetCategory, 'id'>): Promise<AssetCategory> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const cats = MockDatabase.getCategories();
        const newCat: AssetCategory = {
          ...catData,
          id: MockDatabase.generateId('cat')
        };
        MockDatabase.saveCategories([...cats, newCat]);

        const user = MockDatabase.getCurrentUser();
        if (user) {
          MockDatabase.logAction(user.id, user.name, 'Create Category', `Created asset category: ${newCat.name}`);
        }
        resolve(newCat);
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/employees
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: Employee[]
  // }
  //
  // API endpoint name: Get Employees
  // Method: GET
  // Request DTO: None
  // Response DTO: Employee[]
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getEmployees: (): Promise<Employee[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MockDatabase.getEmployees()), 300);
    });
  },

  // BACKEND API
  //
  // Method: PUT
  //
  // Endpoint: /api/employees/:id/role
  //
  // Authentication: JWT Required (Admin only)
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: Employee
  // }
  //
  // API endpoint name: Update Employee Role
  // Method: PUT
  // Request DTO: { role: UserRole, status: 'Active' | 'Inactive', departmentId?: string }
  // Response DTO: Employee
  // Expected Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
  updateEmployeeRole: (employeeId: string, role: UserRole, status: 'Active' | 'Inactive', departmentId?: string): Promise<Employee> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const employees = MockDatabase.getEmployees();
        const index = employees.findIndex(e => e.id === employeeId);
        if (index === -1) {
          reject(new Error('Employee not found.'));
          return;
        }
        const updated = { ...employees[index], role, status, departmentId };
        const updatedList = [...employees];
        updatedList[index] = updated;
        MockDatabase.saveEmployees(updatedList);

        const currentUser = MockDatabase.getCurrentUser();
        if (currentUser) {
          MockDatabase.logAction(
            currentUser.id, 
            currentUser.name, 
            'Update Employee', 
            `Updated employee ${updated.name}: role=${role}, status=${status}`
          );
        }
        resolve(updated);
      }, DELAY);
    });
  },

  // ASSETS

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/assets
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: Asset[]
  // }
  //
  // API endpoint name: Get Assets (with filtering)
  // Method: GET
  // Request DTO: AssetFilterOptions
  // Response DTO: Asset[]
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getAssets: (filters?: AssetFilterOptions): Promise<Asset[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let assets = MockDatabase.getAssets();

        if (filters) {
          const { search, categoryId, status, location, sharedBookable } = filters;
          if (search) {
            const query = search.toLowerCase();
            assets = assets.filter(a => 
              a.name.toLowerCase().includes(query) || 
              a.assetTag.toLowerCase().includes(query) || 
              a.serialNumber.toLowerCase().includes(query) ||
              a.location.toLowerCase().includes(query)
            );
          }
          if (categoryId) {
            assets = assets.filter(a => a.categoryId === categoryId);
          }
          if (status) {
            assets = assets.filter(a => a.status === status);
          }
          if (location) {
            assets = assets.filter(a => a.location.toLowerCase().includes(location.toLowerCase()));
          }
          if (sharedBookable !== undefined) {
            assets = assets.filter(a => a.sharedBookable === sharedBookable);
          }
        }

        resolve(assets);
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/assets/:id
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: Asset
  // }
  //
  // API endpoint name: Get Asset By ID
  // Method: GET
  // Request DTO: { id: string }
  // Response DTO: Asset
  // Expected Status Codes: 200 OK, 401 Unauthorized, 404 Not Found
  getAssetById: (id: string): Promise<Asset | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const assets = MockDatabase.getAssets();
        const found = assets.find(a => a.id === id);
        resolve(found || null);
      }, 300);
    });
  },

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/assets/:assetId/history
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
  // API endpoint name: Get Asset History
  // Method: GET
  // Request DTO: { assetId: string }
  // Response DTO: AssetHistory[]
  // Expected Status Codes: 200 OK, 401 Unauthorized, 404 Not Found
  getAssetHistory: (assetId: string): Promise<AssetHistory[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const history = MockDatabase.getHistory();
        const filtered = history.filter(h => h.assetId === assetId);
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(filtered);
      }, 400);
    });
  },

  // BACKEND API
  //
  // Method: POST
  //
  // Endpoint: /api/assets
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: Asset
  // }
  //
  // API endpoint name: Register Asset
  // Method: POST
  // Request DTO: Omit<Asset, 'id' | 'assetTag' | 'qrCodeUrl'>
  // Response DTO: Asset
  // Expected Status Codes: 201 Created, 400 Bad Request, 401 Unauthorized
  registerAsset: (assetData: Omit<Asset, 'id' | 'assetTag' | 'qrCodeUrl'>): Promise<Asset> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const assets = MockDatabase.getAssets();
        
        // Generate asset tag, e.g. AF-0009
        const lastNum = assets.reduce((max, a) => {
          const tagNum = parseInt(a.assetTag.replace('AF-', ''), 10);
          return isNaN(tagNum) ? max : Math.max(max, tagNum);
        }, 0);
        const nextNum = lastNum + 1;
        const assetTag = `AF-${String(nextNum).padStart(4, '0')}`;

        const newAsset: Asset = {
          ...assetData,
          id: MockDatabase.generateId('ast'),
          assetTag,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${assetTag}`
        };

        MockDatabase.saveAssets([...assets, newAsset]);

        // Log history & audit logs
        const currentUser = MockDatabase.getCurrentUser();
        const actorId = currentUser?.id || 'system';
        const actorName = currentUser?.name || 'System';

        const historyItem: AssetHistory = {
          id: MockDatabase.generateId('h'),
          assetId: newAsset.id,
          type: 'StatusChange',
          title: 'Asset Registered',
          description: `Asset registered into inventory with tag ${assetTag} by ${actorName}`,
          actorId,
          actorName,
          date: new Date().toISOString()
        };

        const existingHistory = MockDatabase.getHistory();
        MockDatabase.saveHistory([historyItem, ...existingHistory]);
        MockDatabase.logAction(actorId, actorName, 'Register Asset', `Registered asset ${newAsset.name} (${assetTag})`);

        resolve(newAsset);
      }, DELAY);
    });
  },

  // CONFLICT-SENSITIVE ALLOCATION

  // BACKEND API
  //
  // Method: POST
  //
  // Endpoint: /api/assets/:id/allocate
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: AssetAllocation
  // }
  //
  // API endpoint name: Allocate Asset
  // Method: POST
  // Request DTO: { assetId: string, holderId: string, holderType: 'Employee' | 'Department', expectedReturnDate?: string }
  // Response DTO: AssetAllocation
  // Expected Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized, 409 Conflict
  allocateAsset: (
    assetId: string, 
    holderId: string, 
    holderType: 'Employee' | 'Department', 
    expectedReturnDate?: string
  ): Promise<AssetAllocation> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const assets = MockDatabase.getAssets();
        const assetIndex = assets.findIndex(a => a.id === assetId);

        if (assetIndex === -1) {
          reject(new Error('Asset not found.'));
          return;
        }

        const asset = assets[assetIndex];

        // Conflict check: Asset cannot be allocated if already allocated or under maintenance
        if (asset.status === 'Allocated') {
          // Identify current holder
          let holderName = 'Another user';
          if (asset.currentHolderType === 'Employee' && asset.currentHolderId) {
            const emp = MockDatabase.getEmployees().find(e => e.id === asset.currentHolderId);
            if (emp) holderName = emp.name;
          } else if (asset.currentHolderType === 'Department' && asset.currentHolderId) {
            const dept = MockDatabase.getDepartments().find(d => d.id === asset.currentHolderId);
            if (dept) holderName = dept.name;
          }
          
          // Custom error containing the holderName so frontend can render a custom conflict warning & transfer offer!
          const error = new Error(`CONFLICT: Asset is currently held by ${holderName}.`) as any;
          error.currentHolderName = holderName;
          error.currentHolderId = asset.currentHolderId;
          error.assetId = assetId;
          reject(error);
          return;
        }

        if (asset.status === 'Under Maintenance' || asset.status === 'Retired' || asset.status === 'Disposed') {
          reject(new Error(`Asset cannot be allocated. Current status is: ${asset.status}`));
          return;
        }

        const currentUser = MockDatabase.getCurrentUser();
        if (!currentUser) {
          reject(new Error('Authentication required.'));
          return;
        }

        // Allocate
        const newAllocation: AssetAllocation = {
          id: MockDatabase.generateId('alc'),
          assetId,
          employeeId: holderType === 'Employee' ? holderId : undefined,
          departmentId: holderType === 'Department' ? holderId : undefined,
          allocatedById: currentUser.id,
          allocatedDate: new Date().toISOString().split('T')[0],
          expectedReturnDate,
          status: 'Active'
        };

        // Update asset
        const updatedAsset: Asset = {
          ...asset,
          status: 'Allocated',
          currentHolderId: holderId,
          currentHolderType: holderType,
          expectedReturnDate
        };

        const updatedAssets = [...assets];
        updatedAssets[assetIndex] = updatedAsset;
        MockDatabase.saveAssets(updatedAssets);

        // Save allocation
        const allocations = MockDatabase.getAllocations();
        MockDatabase.saveAllocations([...allocations, newAllocation]);

        // Create asset history
        let destination = '';
        if (holderType === 'Employee') {
          const emp = MockDatabase.getEmployees().find(e => e.id === holderId);
          destination = emp ? `Employee ${emp.name}` : `Employee ID ${holderId}`;
        } else {
          const dept = MockDatabase.getDepartments().find(d => d.id === holderId);
          destination = dept ? `Department ${dept.name}` : `Department ID ${holderId}`;
        }

        const historyItem: AssetHistory = {
          id: MockDatabase.generateId('h'),
          assetId,
          type: 'Allocation',
          title: 'Asset Allocated',
          description: `Allocated to ${destination} (Expected return: ${expectedReturnDate || 'N/A'})`,
          actorId: currentUser.id,
          actorName: currentUser.name,
          date: new Date().toISOString()
        };

        MockDatabase.saveHistory([historyItem, ...MockDatabase.getHistory()]);
        MockDatabase.logAction(currentUser.id, currentUser.name, 'Allocate Asset', `Allocated ${asset.name} to ${destination}`);

        // Trigger notification
        if (holderType === 'Employee') {
          MockDatabase.addNotification(
            'New Asset Assigned',
            `Asset "${asset.name}" (${asset.assetTag}) has been allocated to you. Expected return: ${expectedReturnDate || 'Permanent'}.`,
            'Asset Assigned'
          );
        }

        resolve(newAllocation);
      }, DELAY);
    });
  },

  // RETURN ASSET

  // BACKEND API
  //
  // Method: POST
  //
  // Endpoint: /api/assets/:id/return
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: null
  // }
  //
  // API endpoint name: Return Asset
  // Method: POST
  // Request DTO: { assetId: string, notes: string, condition: AssetCondition }
  // Response DTO: None (void)
  // Expected Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized, 404 Not Found
  returnAsset: (assetId: string, notes: string, condition: AssetCondition): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const assets = MockDatabase.getAssets();
        const assetIndex = assets.findIndex(a => a.id === assetId);
        if (assetIndex === -1) {
          reject(new Error('Asset not found.'));
          return;
        }

        const asset = assets[assetIndex];
        const currentUser = MockDatabase.getCurrentUser();
        if (!currentUser) {
          reject(new Error('Authentication required.'));
          return;
        }

        const holderId = asset.currentHolderId;
        const holderType = asset.currentHolderType;

        // Update allocations
        const allocations = MockDatabase.getAllocations();
        const alcIndex = allocations.findIndex(alc => alc.assetId === assetId && (alc.status === 'Active' || alc.status === 'Overdue'));
        if (alcIndex !== -1) {
          const alc = allocations[alcIndex];
          allocations[alcIndex] = {
            ...alc,
            status: 'Returned',
            returnDate: new Date().toISOString().split('T')[0],
            conditionNotes: notes
          };
          MockDatabase.saveAllocations(allocations);
        }

        // Revert asset to Available
        const updatedAsset: Asset = {
          ...asset,
          status: 'Available',
          condition,
          currentHolderId: undefined,
          currentHolderType: undefined,
          expectedReturnDate: undefined
        };

        const updatedAssets = [...assets];
        updatedAssets[assetIndex] = updatedAsset;
        MockDatabase.saveAssets(updatedAssets);

        // History
        let source = '';
        if (holderType === 'Employee' && holderId) {
          const emp = MockDatabase.getEmployees().find(e => e.id === holderId);
          source = emp ? `from ${emp.name}` : '';
        } else if (holderType === 'Department' && holderId) {
          const dept = MockDatabase.getDepartments().find(d => d.id === holderId);
          source = dept ? `from ${dept.name}` : '';
        }

        const historyItem: AssetHistory = {
          id: MockDatabase.generateId('h'),
          assetId,
          type: 'StatusChange',
          title: 'Asset Returned',
          description: `Returned ${source}. Condition marked as: ${condition}. Notes: ${notes}`,
          actorId: currentUser.id,
          actorName: currentUser.name,
          date: new Date().toISOString(),
          notes
        };

        MockDatabase.saveHistory([historyItem, ...MockDatabase.getHistory()]);
        MockDatabase.logAction(currentUser.id, currentUser.name, 'Return Asset', `Returned asset ${asset.name}. Condition: ${condition}`);

        resolve();
      }, DELAY);
    });
  },

  // TRANSFER PROCESS

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/transfers
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: TransferRequest[]
  // }
  //
  // API endpoint name: Get Transfers
  // Method: GET
  // Request DTO: None
  // Response DTO: TransferRequest[]
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getTransfers: (): Promise<TransferRequest[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MockDatabase.getTransfers()), 300);
    });
  },

  // BACKEND API
  //
  // Method: POST
  //
  // Endpoint: /api/transfers
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: TransferRequest
  // }
  //
  // API endpoint name: Request Transfer
  // Method: POST
  // Request DTO: { assetId: string, toEmployeeId: string, reason: string }
  // Response DTO: TransferRequest
  // Expected Status Codes: 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found
  requestTransfer: (assetId: string, toEmployeeId: string, reason: string): Promise<TransferRequest> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const assets = MockDatabase.getAssets();
        const asset = assets.find(a => a.id === assetId);
        if (!asset) {
          reject(new Error('Asset not found.'));
          return;
        }

        if (asset.status !== 'Allocated' || !asset.currentHolderId || asset.currentHolderType !== 'Employee') {
          reject(new Error('Asset must be allocated to an employee before initiating a transfer request.'));
          return;
        }

        const currentUser = MockDatabase.getCurrentUser();
        if (!currentUser) {
          reject(new Error('Authentication required.'));
          return;
        }

        const newRequest: TransferRequest = {
          id: MockDatabase.generateId('tr'),
          assetId,
          fromEmployeeId: asset.currentHolderId,
          toEmployeeId,
          reason,
          status: 'Pending',
          requestedDate: new Date().toISOString()
        };

        const transfers = MockDatabase.getTransfers();
        MockDatabase.saveTransfers([...transfers, newRequest]);

        const employees = MockDatabase.getEmployees();
        const targetEmp = employees.find(e => e.id === toEmployeeId);
        const targetName = targetEmp ? targetEmp.name : 'Another employee';

        // Add history
        const historyItem: AssetHistory = {
          id: MockDatabase.generateId('h'),
          assetId,
          type: 'Transfer',
          title: 'Transfer Requested',
          description: `Transfer request created from ${currentUser.name} to ${targetName}. Reason: ${reason}`,
          actorId: currentUser.id,
          actorName: currentUser.name,
          date: new Date().toISOString()
        };
        MockDatabase.saveHistory([historyItem, ...MockDatabase.getHistory()]);

        MockDatabase.logAction(
          currentUser.id, 
          currentUser.name, 
          'Transfer Request', 
          `Requested transfer of ${asset.name} to ${targetName}`
        );

        MockDatabase.addNotification(
          'Asset Transfer Requested',
          `Transfer requested for ${asset.name} from ${currentUser.name} to ${targetName}. Pending approval.`,
          'Asset Assigned'
        );

        resolve(newRequest);
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: POST
  //
  // Endpoint: /api/transfers/:id/approve
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: null
  // }
  //
  // API endpoint name: Approve Transfer
  // Method: POST
  // Request DTO: { id: string }
  // Response DTO: None (void)
  // Expected Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized, 404 Not Found
  approveTransfer: (transferId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const transfers = MockDatabase.getTransfers();
        const trIndex = transfers.findIndex(t => t.id === transferId);
        if (trIndex === -1) {
          reject(new Error('Transfer request not found.'));
          return;
        }

        const tr = transfers[trIndex];
        if (tr.status !== 'Pending') {
          reject(new Error('This transfer request has already been actioned.'));
          return;
        }

        const currentUser = MockDatabase.getCurrentUser();
        if (!currentUser) {
          reject(new Error('Authentication required.'));
          return;
        }

        const assets = MockDatabase.getAssets();
        const assetIndex = assets.findIndex(a => a.id === tr.assetId);
        if (assetIndex === -1) {
          reject(new Error('Associated asset not found.'));
          return;
        }

        const asset = assets[assetIndex];

        // Complete previous allocation
        const allocations = MockDatabase.getAllocations();
        const activeAlcIndex = allocations.findIndex(alc => alc.assetId === tr.assetId && (alc.status === 'Active' || alc.status === 'Overdue'));
        if (activeAlcIndex !== -1) {
          allocations[activeAlcIndex] = {
            ...allocations[activeAlcIndex],
            status: 'Returned',
            returnDate: new Date().toISOString().split('T')[0],
            conditionNotes: 'Transferred directly to another employee.'
          };
        }

        // Create new allocation
        const newAllocation: AssetAllocation = {
          id: MockDatabase.generateId('alc'),
          assetId: tr.assetId,
          employeeId: tr.toEmployeeId,
          allocatedById: currentUser.id,
          allocatedDate: new Date().toISOString().split('T')[0],
          status: 'Active'
        };
        allocations.push(newAllocation);
        MockDatabase.saveAllocations(allocations);

        // Update Asset current holder
        assets[assetIndex] = {
          ...asset,
          currentHolderId: tr.toEmployeeId,
          currentHolderType: 'Employee',
          expectedReturnDate: undefined // Resets expected return, or can keep open
        };
        MockDatabase.saveAssets(assets);

        // Update transfer request status
        transfers[trIndex] = {
          ...tr,
          status: 'Approved',
          actionedDate: new Date().toISOString(),
          actionedById: currentUser.id
        };
        MockDatabase.saveTransfers(transfers);

        const employees = MockDatabase.getEmployees();
        const fromEmp = employees.find(e => e.id === tr.fromEmployeeId);
        const toEmp = employees.find(e => e.id === tr.toEmployeeId);
        const fromName = fromEmp ? fromEmp.name : 'Previous holder';
        const toName = toEmp ? toEmp.name : 'New holder';

        // History
        const historyItem: AssetHistory = {
          id: MockDatabase.generateId('h'),
          assetId: tr.assetId,
          type: 'Transfer',
          title: 'Transfer Approved',
          description: `Transfer of asset from ${fromName} to ${toName} approved by Manager ${currentUser.name}. Ownership updated.`,
          actorId: currentUser.id,
          actorName: currentUser.name,
          date: new Date().toISOString()
        };
        MockDatabase.saveHistory([historyItem, ...MockDatabase.getHistory()]);

        MockDatabase.logAction(
          currentUser.id, 
          currentUser.name, 
          'Approve Transfer', 
          `Approved transfer of ${asset.name} from ${fromName} to ${toName}`
        );

        // Notifications
        MockDatabase.addNotification(
          'Transfer Approved',
          `Asset "${asset.name}" transfer request from ${fromName} to ${toName} has been approved.`,
          'Transfer Approved'
        );

        resolve();
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: POST
  //
  // Endpoint: /api/transfers/:id/reject
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: null
  // }
  //
  // API endpoint name: Reject Transfer
  // Method: POST
  // Request DTO: { id: string }
  // Response DTO: None (void)
  // Expected Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized, 404 Not Found
  rejectTransfer: (transferId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const transfers = MockDatabase.getTransfers();
        const trIndex = transfers.findIndex(t => t.id === transferId);
        if (trIndex === -1) {
          reject(new Error('Transfer request not found.'));
          return;
        }

        const tr = transfers[trIndex];
        if (tr.status !== 'Pending') {
          reject(new Error('This transfer request has already been actioned.'));
          return;
        }

        const currentUser = MockDatabase.getCurrentUser();
        if (!currentUser) {
          reject(new Error('Authentication required.'));
          return;
        }

        // Update transfer request status
        transfers[trIndex] = {
          ...tr,
          status: 'Rejected',
          actionedDate: new Date().toISOString(),
          actionedById: currentUser.id
        };
        MockDatabase.saveTransfers(transfers);

        const assets = MockDatabase.getAssets();
        const asset = assets.find(a => a.id === tr.assetId);
        const assetName = asset ? asset.name : 'Asset';

        // History
        const historyItem: AssetHistory = {
          id: MockDatabase.generateId('h'),
          assetId: tr.assetId,
          type: 'Transfer',
          title: 'Transfer Rejected',
          description: `Transfer request from ${tr.fromEmployeeId} to ${tr.toEmployeeId} rejected by ${currentUser.name}.`,
          actorId: currentUser.id,
          actorName: currentUser.name,
          date: new Date().toISOString()
        };
        MockDatabase.saveHistory([historyItem, ...MockDatabase.getHistory()]);

        MockDatabase.logAction(
          currentUser.id, 
          currentUser.name, 
          'Reject Transfer', 
          `Rejected transfer request of ${assetName}`
        );

        MockDatabase.addNotification(
          'Transfer Rejected',
          `Transfer request for "${assetName}" has been rejected.`,
          'Maintenance Rejected'
        );

        resolve();
      }, DELAY);
    });
  }
};
