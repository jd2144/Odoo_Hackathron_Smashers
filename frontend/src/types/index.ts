export type UserRole = 'Admin' | 'Asset Manager' | 'Department Head' | 'Employee';

export type AssetCondition = 'New' | 'Good' | 'Fair' | 'Poor' | 'Broken';

export type AssetStatus = 
  | 'Available' 
  | 'Allocated' 
  | 'Reserved' 
  | 'Under Maintenance' 
  | 'Lost' 
  | 'Retired' 
  | 'Disposed';

export type DepartmentStatus = 'Active' | 'Inactive';
export type EmployeeStatus = 'Active' | 'Inactive' | 'Pending Approval' | 'Rejected';
export type BookingStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
export type MaintenanceStatus = 
  | 'Pending' 
  | 'Approved' 
  | 'Rejected' 
  | 'Technician Assigned' 
  | 'In Progress' 
  | 'Resolved';

export type AuditCycleStatus = 'Draft' | 'Active' | 'Completed';
export type AuditItemStatus = 'Pending' | 'Verified' | 'Missing' | 'Damaged';

export interface Department {
  id: string;
  name: string;
  headId?: string; // Employee ID
  parentDepartmentId?: string; // For hierarchy
  status: DepartmentStatus;
  createdAt: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  description: string;
  customFields?: {
    name: string;
    type: 'string' | 'number' | 'boolean';
    required: boolean;
  }[];
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  departmentId?: string;
  role: UserRole;
  status: EmployeeStatus;
  avatarUrl?: string;
  username?: string;
  password?: string;
  requestedRole?: UserRole;
  isApproved?: boolean;
  registrationDate?: string;
  rejectionReason?: string;
  estimatedReviewTime?: string;
}

export interface Asset {
  id: string;
  name: string;
  categoryId: string;
  assetTag: string; // AE-0001
  serialNumber: string;
  acquisitionDate: string;
  acquisitionCost: number;
  condition: AssetCondition;
  location: string;
  photoUrl?: string;
  sharedBookable: boolean;
  status: AssetStatus;
  currentHolderId?: string; // Employee or Department ID
  currentHolderType?: 'Employee' | 'Department';
  expectedReturnDate?: string;
  qrCodeUrl?: string;
}

export interface AssetHistory {
  id: string;
  assetId: string;
  type: 'Allocation' | 'Transfer' | 'Maintenance' | 'Audit' | 'StatusChange';
  title: string;
  description: string;
  actorId: string; // Employee ID
  actorName: string;
  date: string;
  notes?: string;
}

export interface AssetAllocation {
  id: string;
  assetId: string;
  employeeId?: string;
  departmentId?: string;
  allocatedById: string;
  allocatedDate: string;
  expectedReturnDate?: string;
  returnDate?: string;
  status: 'Active' | 'Returned' | 'Overdue';
  conditionNotes?: string;
}

export interface TransferRequest {
  id: string;
  assetId: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedDate: string;
  actionedDate?: string;
  actionedById?: string;
}

export interface ResourceBooking {
  id: string;
  assetId: string; // Must be "sharedBookable": true
  bookedById: string;
  bookedByName: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes?: string;
}

export interface MaintenanceRequest {
  id: string;
  assetId: string;
  reportedById: string;
  reportedByName: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  photoUrl?: string;
  status: MaintenanceStatus;
  createdDate: string;
  actionedDate?: string;
  technicianName?: string;
  cost?: number;
  notes?: string;
}

export interface AuditCycle {
  id: string;
  name: string;
  scopeType: 'Department' | 'Location' | 'All';
  scopeId?: string; // Department ID or Location Name
  startDate: string;
  endDate: string;
  assignedAuditorIds: string[]; // Employee IDs
  status: AuditCycleStatus;
  closedDate?: string;
}

export interface AuditItem {
  id: string;
  auditCycleId: string;
  assetId: string;
  status: AuditItemStatus;
  verifiedDate?: string;
  notes?: string;
  auditorId?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 
    | 'Asset Assigned' 
    | 'Maintenance Approved' 
    | 'Maintenance Rejected' 
    | 'Booking Confirmed' 
    | 'Booking Cancelled' 
    | 'Booking Reminder' 
    | 'Transfer Approved' 
    | 'Overdue Return Alert' 
    | 'Audit Discrepancy Flagged';
  isRead: boolean;
  createdDate: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  details: string;
  timestamp: string;
}
