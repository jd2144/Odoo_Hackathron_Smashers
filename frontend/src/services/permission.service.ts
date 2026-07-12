import { UserRole } from '../types';

export type PermissionAction = 
  | 'VIEW_DASHBOARD'
  | 'VIEW_ORGANIZATION_SETUP'
  | 'VIEW_ASSETS'
  | 'MANAGE_ASSETS' // Asset creation, edit, deletion
  | 'VIEW_ALLOCATIONS'
  | 'MANAGE_ALLOCATIONS' // Allocate and return
  | 'VIEW_BOOKINGS'
  | 'MANAGE_BOOKINGS' // Create, approve, cancel bookings
  | 'VIEW_MAINTENANCE'
  | 'MANAGE_MAINTENANCE' // Approve, assign, resolve maintenance
  | 'VIEW_AUDITS'
  | 'MANAGE_AUDITS'
  | 'VIEW_REPORTS'
  | 'VIEW_NOTIFICATIONS'
  | 'VIEW_SETTINGS';

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  Admin: [
    'VIEW_DASHBOARD',
    'VIEW_ORGANIZATION_SETUP',
    'VIEW_ASSETS',
    'MANAGE_ASSETS',
    'VIEW_ALLOCATIONS',
    'MANAGE_ALLOCATIONS',
    'VIEW_BOOKINGS',
    'MANAGE_BOOKINGS',
    'VIEW_MAINTENANCE',
    'MANAGE_MAINTENANCE',
    'VIEW_AUDITS',
    'MANAGE_AUDITS',
    'VIEW_REPORTS',
    'VIEW_NOTIFICATIONS',
    'VIEW_SETTINGS'
  ],
  'Asset Manager': [
    'VIEW_DASHBOARD',
    'VIEW_ASSETS',
    'MANAGE_ASSETS',
    'VIEW_ALLOCATIONS',
    'MANAGE_ALLOCATIONS',
    'VIEW_MAINTENANCE',
    'MANAGE_MAINTENANCE',
    'VIEW_AUDITS',
    'MANAGE_AUDITS',
    'VIEW_REPORTS',
    'VIEW_NOTIFICATIONS',
    'VIEW_SETTINGS'
  ],
  'Department Head': [
    'VIEW_DASHBOARD',
    'VIEW_ASSETS',
    'VIEW_ALLOCATIONS',
    'VIEW_BOOKINGS',
    'MANAGE_BOOKINGS',
    'VIEW_MAINTENANCE',
    'VIEW_AUDITS',
    'VIEW_NOTIFICATIONS',
    'VIEW_SETTINGS'
  ],
  Employee: [
    'VIEW_DASHBOARD',
    'VIEW_ASSETS',
    'VIEW_BOOKINGS',
    'MANAGE_BOOKINGS',
    'VIEW_NOTIFICATIONS',
    'VIEW_SETTINGS'
  ]
};

export const PermissionService = {
  // Checks if a given role is allowed to perform an action
  hasPermission: (role: UserRole, action: PermissionAction): boolean => {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;
    return permissions.includes(action);
  },

  // Returns exact menu items accessible by the role
  getSidebarMenuAccess: (role: UserRole): string[] => {
    const menuAccess: string[] = ['Dashboard', 'Notifications', 'Settings'];
    
    if (role === 'Admin') {
      menuAccess.push('Organization Setup', 'Asset Management', 'Asset Allocation', 'Resource Booking', 'Maintenance', 'Asset Audit', 'Reports');
    } else if (role === 'Asset Manager') {
      menuAccess.push('Asset Management', 'Asset Allocation', 'Maintenance', 'Asset Audit', 'Reports');
    } else if (role === 'Department Head') {
      menuAccess.push('Asset Management', 'Asset Allocation', 'Resource Booking', 'Maintenance', 'Asset Audit');
    } else if (role === 'Employee') {
      menuAccess.push('Asset Management', 'Resource Booking', 'Maintenance');
    }
    
    return menuAccess;
  }
};
export default PermissionService;
