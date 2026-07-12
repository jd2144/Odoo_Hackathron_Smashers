import { 
  Department, 
  AssetCategory, 
  Employee, 
  Asset, 
  AssetHistory,
  AssetAllocation, 
  TransferRequest, 
  ResourceBooking, 
  MaintenanceRequest, 
  AuditCycle, 
  AuditItem, 
  Notification, 
  AuditLog 
} from '../types';

// Helper to get from local storage or set default
const getOrInit = <T>(key: string, initial: T): T => {
  const data = localStorage.getItem(`assetflow_${key}`);
  if (data) {
    try {
      return JSON.parse(data) as T;
    } catch {
      return initial;
    }
  }
  localStorage.setItem(`assetflow_${key}`, JSON.stringify(initial));
  return initial;
};

// INITIAL DATASETS
const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dep-1', name: 'Engineering & IT', headId: 'emp-3', status: 'Active', createdAt: '2025-01-10T08:00:00Z' },
  { id: 'dep-2', name: 'Operations & Logistics', headId: 'emp-4', status: 'Active', createdAt: '2025-01-11T09:30:00Z' },
  { id: 'dep-3', name: 'Marketing & Creative', headId: 'emp-5', status: 'Active', createdAt: '2025-01-12T11:00:00Z' },
  { id: 'dep-4', name: 'Human Resources', headId: 'emp-6', status: 'Active', createdAt: '2025-01-15T14:00:00Z' },
];

const INITIAL_CATEGORIES: AssetCategory[] = [
  { 
    id: 'cat-1', 
    name: 'Electronics', 
    description: 'Computers, laptops, mobile devices, screens, and peripherals.',
    customFields: [
      { name: 'Warranty Period (Months)', type: 'number', required: true },
      { name: 'Operating System', type: 'string', required: false }
    ]
  },
  { 
    id: 'cat-2', 
    name: 'Furniture', 
    description: 'Desks, chairs, cabinets, conference tables, and office fixtures.',
    customFields: [
      { name: 'Material', type: 'string', required: false }
    ]
  },
  { 
    id: 'cat-3', 
    name: 'Vehicles', 
    description: 'Company fleet cars, delivery vans, and electric shuttles.',
    customFields: [
      { name: 'License Plate', type: 'string', required: true },
      { name: 'Fuel Type', type: 'string', required: true }
    ]
  },
  { 
    id: 'cat-4', 
    name: 'Shared Spaces', 
    description: 'Conference rooms, focus booths, studios, and testing laboratories.',
    customFields: [
      { name: 'Capacity', type: 'number', required: true },
      { name: 'AV Equipment', type: 'boolean', required: false }
    ]
  }
];

const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Alexander Wright', email: 'admin@assetflow.com', role: 'Admin', status: 'Active', departmentId: 'dep-1', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80' },
  { id: 'emp-2', name: 'Sarah Connor', email: 'manager@assetflow.com', role: 'Asset Manager', status: 'Active', departmentId: 'dep-2', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80' },
  { id: 'emp-3', name: 'Marcus Aurelius', email: 'it-head@assetflow.com', role: 'Department Head', status: 'Active', departmentId: 'dep-1', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80' },
  { id: 'emp-4', name: 'David Miller', email: 'ops-head@assetflow.com', role: 'Department Head', status: 'Active', departmentId: 'dep-2', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=80' },
  { id: 'emp-5', name: 'Elena Rostova', email: 'marketing-head@assetflow.com', role: 'Department Head', status: 'Active', departmentId: 'dep-3', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop&q=80' },
  { id: 'emp-6', name: 'Clara Oswald', email: 'hr-head@assetflow.com', role: 'Department Head', status: 'Active', departmentId: 'dep-4', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&fit=crop&q=80' },
  { id: 'emp-7', name: 'John Doe', email: 'employee@assetflow.com', role: 'Employee', status: 'Active', departmentId: 'dep-1', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&fit=crop&q=80' },
  { id: 'emp-8', name: 'Jane Smith', email: 'janesmith@assetflow.com', role: 'Employee', status: 'Active', departmentId: 'dep-3', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80' },
  { id: 'emp-9', name: 'Robert Chen', email: 'rchen@assetflow.com', role: 'Employee', status: 'Active', departmentId: 'dep-1', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&fit=crop&q=80' },
  { id: 'emp-10', name: 'William Blake', email: 'wblake@assetflow.com', role: 'Employee', status: 'Inactive', departmentId: 'dep-2', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&fit=crop&q=80' }
];

const INITIAL_ASSETS: Asset[] = [
  { id: 'ast-1', name: 'MacBook Pro 16" M3 Max', categoryId: 'cat-1', assetTag: 'AF-0001', serialNumber: 'C02F1234Q05D', acquisitionDate: '2025-02-15', acquisitionCost: 3499, condition: 'New', location: 'IT Lab Rack A', sharedBookable: false, status: 'Allocated', currentHolderId: 'emp-7', currentHolderType: 'Employee', expectedReturnDate: '2026-07-20', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AF-0001' },
  { id: 'ast-2', name: 'Dell XPS 15 9530', categoryId: 'cat-1', assetTag: 'AF-0002', serialNumber: 'DELL-889012-XPS', acquisitionDate: '2025-03-10', acquisitionCost: 1999, condition: 'Good', location: 'HQ Store Room', sharedBookable: false, status: 'Available', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AF-0002' },
  { id: 'ast-3', name: 'iPhone 15 Pro 256GB', categoryId: 'cat-1', assetTag: 'AF-0003', serialNumber: 'DNPGW123QW12', acquisitionDate: '2025-01-20', acquisitionCost: 1099, condition: 'Good', location: 'IT Head Office', sharedBookable: false, status: 'Allocated', currentHolderId: 'emp-3', currentHolderType: 'Employee', expectedReturnDate: '2026-06-15', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AF-0003' }, // Overdue return
  { id: 'ast-4', name: 'Ergonomic Desk Chair Steelcase Gesture', categoryId: 'cat-2', assetTag: 'AF-0004', serialNumber: 'STEEL-GEST-7711', acquisitionDate: '2025-01-05', acquisitionCost: 1250, condition: 'Good', location: 'Engineering Bay 3', sharedBookable: false, status: 'Allocated', currentHolderId: 'dep-1', currentHolderType: 'Department', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AF-0004' },
  { id: 'ast-5', name: 'Tesla Model 3 Shared Car', categoryId: 'cat-3', assetTag: 'AF-0005', serialNumber: '5YJ3E1EBXLF12345', acquisitionDate: '2025-01-15', acquisitionCost: 42000, condition: 'Good', location: 'Parking Space P12', sharedBookable: true, status: 'Available', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AF-0005' },
  { id: 'ast-6', name: 'Boardroom Alpha (AV Enabled)', categoryId: 'cat-4', assetTag: 'AF-0006', serialNumber: 'ROOM-ALPHA-2F', acquisitionDate: '2025-01-01', acquisitionCost: 15000, condition: 'New', location: 'Building A, Floor 2', sharedBookable: true, status: 'Available', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AF-0006' },
  { id: 'ast-7', name: 'Podcast & Media Studio', categoryId: 'cat-4', assetTag: 'AF-0007', serialNumber: 'ROOM-STUDIO-1F', acquisitionDate: '2025-01-05', acquisitionCost: 8000, condition: 'Good', location: 'Building B, Floor 1', sharedBookable: true, status: 'Under Maintenance', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AF-0007' },
  { id: 'ast-8', name: 'iPad Pro 12.9" M2', categoryId: 'cat-1', assetTag: 'AF-0008', serialNumber: 'DLXGW778QX12', acquisitionDate: '2025-04-01', acquisitionCost: 1199, condition: 'Good', location: 'Marketing Tech Drawer', sharedBookable: false, status: 'Available', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AF-0008' }
];

const INITIAL_HISTORY: AssetHistory[] = [
  { id: 'h-1', assetId: 'ast-1', type: 'StatusChange', title: 'Asset Registered', description: 'Registered in system by Sarah Connor', actorId: 'emp-2', actorName: 'Sarah Connor', date: '2025-02-15T10:00:00Z' },
  { id: 'h-2', assetId: 'ast-1', type: 'Allocation', title: 'Asset Allocated', description: 'Allocated to employee John Doe until 2026-07-20', actorId: 'emp-2', actorName: 'Sarah Connor', date: '2025-02-15T11:30:00Z' },
  { id: 'h-3', assetId: 'ast-7', type: 'Maintenance', title: 'Maintenance Flagged', description: 'Studio microphone failure reported', actorId: 'emp-5', actorName: 'Elena Rostova', date: '2026-07-10T14:20:00Z' }
];

const INITIAL_ALLOCATIONS: AssetAllocation[] = [
  { id: 'alc-1', assetId: 'ast-1', employeeId: 'emp-7', allocatedById: 'emp-2', allocatedDate: '2025-02-15', expectedReturnDate: '2026-07-20', status: 'Active' },
  { id: 'alc-2', assetId: 'ast-3', employeeId: 'emp-3', allocatedById: 'emp-2', allocatedDate: '2025-01-20', expectedReturnDate: '2026-06-15', status: 'Overdue' }, // past due (today is 2026-07-11)
  { id: 'alc-3', assetId: 'ast-4', departmentId: 'dep-1', allocatedById: 'emp-2', allocatedDate: '2025-01-05', status: 'Active' }
];

const INITIAL_TRANSFERS: TransferRequest[] = [
  { id: 'tr-1', assetId: 'ast-1', fromEmployeeId: 'emp-7', toEmployeeId: 'emp-9', reason: 'Developer Robert Chen needs high compute for rendering pipeline', status: 'Pending', requestedDate: '2026-07-10T15:30:00Z' }
];

const INITIAL_BOOKINGS: ResourceBooking[] = [
  { id: 'b-1', assetId: 'ast-6', bookedById: 'emp-3', bookedByName: 'Marcus Aurelius', startTime: '2026-07-12T09:00:00Z', endTime: '2026-07-12T11:00:00Z', status: 'Upcoming', notes: 'Engineering Architecture Sync' },
  { id: 'b-2', assetId: 'ast-6', bookedById: 'emp-5', bookedByName: 'Elena Rostova', startTime: '2026-07-12T14:00:00Z', endTime: '2026-07-12T15:30:00Z', status: 'Upcoming', notes: 'Marketing Campaign Launch Brief' },
  { id: 'b-3', assetId: 'ast-5', bookedById: 'emp-7', bookedByName: 'John Doe', startTime: '2026-07-11T10:00:00Z', endTime: '2026-07-11T16:00:00Z', status: 'Completed', notes: 'Offsite Client Meeting' }
];

const INITIAL_MAINTENANCE: MaintenanceRequest[] = [
  { id: 'm-1', assetId: 'ast-7', reportedById: 'emp-5', reportedByName: 'Elena Rostova', description: 'Left studio microphone is generating static buzz. Needs testing and capsule replacement.', priority: 'High', status: 'In Progress', createdDate: '2026-07-10T14:20:00Z', technicianName: 'Dave Sparks (Tech-Solutions)', notes: 'On-site repair scheduled' },
  { id: 'm-2', assetId: 'ast-2', reportedById: 'emp-7', reportedByName: 'John Doe', description: 'Battery swelling issue. The trackpad is slightly lifted.', priority: 'Critical', status: 'Pending', createdDate: '2026-07-11T12:00:00Z' }
];

const INITIAL_AUDITS: AuditCycle[] = [
  { id: 'aud-1', name: 'Q3 IT Infrastructure Audit', scopeType: 'Department', scopeId: 'dep-1', startDate: '2026-07-01', endDate: '2026-07-15', assignedAuditorIds: ['emp-2'], status: 'Active' }
];

const INITIAL_AUDIT_ITEMS: AuditItem[] = [
  { id: 'aui-1', auditCycleId: 'aud-1', assetId: 'ast-1', status: 'Verified', verifiedDate: '2026-07-05', auditorId: 'emp-2', notes: 'In possession of John, condition: excellent' },
  { id: 'aui-2', auditCycleId: 'aud-1', assetId: 'ast-3', status: 'Pending' },
  { id: 'aui-3', auditCycleId: 'aud-1', assetId: 'ast-4', status: 'Pending' },
  { id: 'aui-4', auditCycleId: 'aud-1', assetId: 'ast-8', status: 'Verified', verifiedDate: '2026-07-06', auditorId: 'emp-2', notes: 'Located in Tech Drawer' }
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n-1', title: 'Overdue Asset Return Alert', message: 'Asset iPhone 15 Pro (AF-0003) is past its expected return date (2026-06-15).', type: 'Overdue Return Alert', isRead: false, createdDate: '2026-06-16T08:00:00Z' },
  { id: 'n-2', title: 'New Transfer Request', message: 'John Doe initiated a transfer request for MacBook Pro (AF-0001) to Robert Chen.', type: 'Asset Assigned', isRead: false, createdDate: '2026-07-10T15:30:00Z' },
  { id: 'n-3', title: 'Maintenance Approved', message: 'Maintenance request for Podcast & Media Studio (AF-0007) has been approved and moved to In Progress.', type: 'Maintenance Approved', isRead: true, createdDate: '2026-07-10T14:30:00Z' }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'log-1', actorId: 'emp-2', actorName: 'Sarah Connor', action: 'Asset Registered', details: 'Registered a new asset: MacBook Pro (AF-0001)', timestamp: '2025-02-15T10:00:00Z' },
  { id: 'log-2', actorId: 'emp-2', actorName: 'Sarah Connor', action: 'Asset Allocated', details: 'Allocated MacBook Pro (AF-0001) to John Doe', timestamp: '2025-02-15T11:30:00Z' },
  { id: 'log-3', actorId: 'emp-2', actorName: 'Sarah Connor', action: 'Audit Created', details: 'Created Audit Cycle: Q3 IT Infrastructure Audit', timestamp: '2026-07-01T09:00:00Z' }
];

// STATE INTERFACE & HANDLER
export class MockDatabase {
  static getDepartments = () => getOrInit('departments', INITIAL_DEPARTMENTS);
  static saveDepartments = (data: Department[]) => localStorage.setItem('assetflow_departments', JSON.stringify(data));

  static getCategories = () => getOrInit('categories', INITIAL_CATEGORIES);
  static saveCategories = (data: AssetCategory[]) => localStorage.setItem('assetflow_categories', JSON.stringify(data));

  static getEmployees = () => getOrInit('employees', INITIAL_EMPLOYEES);
  static saveEmployees = (data: Employee[]) => localStorage.setItem('assetflow_employees', JSON.stringify(data));

  static getAssets = () => getOrInit('assets', INITIAL_ASSETS);
  static saveAssets = (data: Asset[]) => localStorage.setItem('assetflow_assets', JSON.stringify(data));

  static getHistory = () => getOrInit('history', INITIAL_HISTORY);
  static saveHistory = (data: AssetHistory[]) => localStorage.setItem('assetflow_history', JSON.stringify(data));

  static getAllocations = () => getOrInit('allocations', INITIAL_ALLOCATIONS);
  static saveAllocations = (data: AssetAllocation[]) => localStorage.setItem('assetflow_allocations', JSON.stringify(data));

  static getTransfers = () => getOrInit('transfers', INITIAL_TRANSFERS);
  static saveTransfers = (data: TransferRequest[]) => localStorage.setItem('assetflow_transfers', JSON.stringify(data));

  static getBookings = () => getOrInit('bookings', INITIAL_BOOKINGS);
  static saveBookings = (data: ResourceBooking[]) => localStorage.setItem('assetflow_bookings', JSON.stringify(data));

  static getMaintenance = () => getOrInit('maintenance', INITIAL_MAINTENANCE);
  static saveMaintenance = (data: MaintenanceRequest[]) => localStorage.setItem('assetflow_maintenance', JSON.stringify(data));

  static getAudits = () => getOrInit('audits', INITIAL_AUDITS);
  static saveAudits = (data: AuditCycle[]) => localStorage.setItem('assetflow_audits', JSON.stringify(data));

  static getAuditItems = () => getOrInit('audit_items', INITIAL_AUDIT_ITEMS);
  static saveAuditItems = (data: AuditItem[]) => localStorage.setItem('assetflow_audit_items', JSON.stringify(data));

  static getNotifications = () => getOrInit('notifications', INITIAL_NOTIFICATIONS);
  static saveNotifications = (data: Notification[]) => localStorage.setItem('assetflow_notifications', JSON.stringify(data));

  static getAuditLogs = () => getOrInit('logs', INITIAL_AUDIT_LOGS);
  static saveAuditLogs = (data: AuditLog[]) => localStorage.setItem('assetflow_logs', JSON.stringify(data));

  // CURRENT AUTHENTICATED USER STATE (Simulating Session)
  static getCurrentUser = (): Employee | null => {
    const userJson = localStorage.getItem('assetflow_currentUser');
    if (userJson) {
      try {
        return JSON.parse(userJson) as Employee;
      } catch {
        return null;
      }
    }
    // Set John Doe as the default logged in user initially for convenience
    const johnDoe = this.getEmployees().find(e => e.email === 'employee@assetflow.com') || null;
    if (johnDoe) {
      localStorage.setItem('assetflow_currentUser', JSON.stringify(johnDoe));
    }
    return johnDoe;
  };

  static setCurrentUser = (user: Employee | null) => {
    if (user) {
      localStorage.setItem('assetflow_currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('assetflow_currentUser');
    }
  };

  static getActiveUser = (): Employee | null => {
    return this.getCurrentUser();
  };

  static saveActiveUser = (user: Employee | null) => {
    this.setCurrentUser(user);
  };

  static initialize = () => {
    this.getDepartments();
    this.getCategories();
    this.getEmployees();
    this.getAssets();
    this.getHistory();
    this.getAllocations();
    this.getTransfers();
    this.getBookings();
    this.getMaintenance();
    this.getAudits();
    this.getAuditItems();
    this.getNotifications();
    this.getAuditLogs();
  };

  // HELPER TO GENERATE NEW ID
  static generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

  // LOG AUDIT ACTIONS HELPER
  static logAction = (actorId: string, actorName: string, action: string, details: string) => {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: this.generateId('log'),
      actorId,
      actorName,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.saveAuditLogs([newLog, ...logs]);
  };

  // TRIGGER NOTIFICATION HELPER
  static addNotification = (
    title: string, 
    message: string, 
    type: Notification['type']
  ) => {
    const notifs = this.getNotifications();
    const newNotif: Notification = {
      id: this.generateId('n'),
      title,
      message,
      type,
      isRead: false,
      createdDate: new Date().toISOString()
    };
    this.saveNotifications([newNotif, ...notifs]);
  };
}
