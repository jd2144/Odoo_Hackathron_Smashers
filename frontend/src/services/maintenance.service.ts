import { MockDatabase } from './mockDb';
import { MaintenanceRequest, MaintenanceStatus, AssetHistory, Asset } from '../types';

const DELAY = 500;

export const maintenanceService = {
  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/maintenance
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: MaintenanceRequest[]
  // }
  //
  // API endpoint name: Get Maintenance Requests
  // Method: GET
  // Request DTO: None
  // Response DTO: MaintenanceRequest[]
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getMaintenanceRequests: (): Promise<MaintenanceRequest[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MockDatabase.getMaintenance());
      }, 300);
    });
  },

  // BACKEND API
  //
  // Method: POST
  //
  // Endpoint: /api/maintenance
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: MaintenanceRequest
  // }
  //
  // API endpoint name: Create Maintenance Request
  // Method: POST
  // Request DTO: { assetId: string, description: string, priority: 'Low' | 'Medium' | 'High' | 'Critical', photoUrl?: string }
  // Response DTO: MaintenanceRequest
  // Expected Status Codes: 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found
  createMaintenanceRequest: (
    assetId: string, 
    description: string, 
    priority: MaintenanceRequest['priority'],
    photoUrl?: string
  ): Promise<MaintenanceRequest> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const currentUser = MockDatabase.getCurrentUser();
        if (!currentUser) {
          reject(new Error('Authentication required.'));
          return;
        }

        const assets = MockDatabase.getAssets();
        const asset = assets.find(a => a.id === assetId);
        if (!asset) {
          reject(new Error('Asset not found.'));
          return;
        }

        const newRequest: MaintenanceRequest = {
          id: MockDatabase.generateId('m'),
          assetId,
          reportedById: currentUser.id,
          reportedByName: currentUser.name,
          description,
          priority,
          photoUrl,
          status: 'Pending',
          createdDate: new Date().toISOString()
        };

        const list = MockDatabase.getMaintenance();
        MockDatabase.saveMaintenance([...list, newRequest]);

        // Add history
        const historyItem: AssetHistory = {
          id: MockDatabase.generateId('h'),
          assetId,
          type: 'Maintenance',
          title: 'Maintenance Requested',
          description: `Repair ticket opened by ${currentUser.name}. Priority: ${priority}. Issue: ${description}`,
          actorId: currentUser.id,
          actorName: currentUser.name,
          date: new Date().toISOString()
        };
        MockDatabase.saveHistory([historyItem, ...MockDatabase.getHistory()]);

        MockDatabase.logAction(
          currentUser.id, 
          currentUser.name, 
          'Raise Maintenance', 
          `Opened repair ticket for ${asset.name} (${asset.assetTag})`
        );

        MockDatabase.addNotification(
          'Maintenance Ticket Raised',
          `A new ${priority} priority repair ticket has been raised for "${asset.name}" and is pending approval.`,
          'Asset Assigned'
        );

        resolve(newRequest);
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: PUT
  //
  // Endpoint: /api/maintenance/:id
  //
  // Authentication: JWT Required (Manager / Admin)
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: MaintenanceRequest
  // }
  //
  // API endpoint name: Update Maintenance Request Status
  // Method: PUT
  // Request DTO: { status: MaintenanceStatus, updates?: { technicianName?: string; notes?: string; cost?: number } }
  // Response DTO: MaintenanceRequest
  // Expected Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
  updateRequestStatus: (
    requestId: string, 
    status: MaintenanceStatus, 
    updates?: { technicianName?: string; notes?: string; cost?: number }
  ): Promise<MaintenanceRequest> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const list = MockDatabase.getMaintenance();
        const index = list.findIndex(m => m.id === requestId);
        if (index === -1) {
          reject(new Error('Maintenance request not found.'));
          return;
        }

        const request = list[index];
        const assets = MockDatabase.getAssets();
        const assetIndex = assets.findIndex(a => a.id === request.assetId);
        if (assetIndex === -1) {
          reject(new Error('Associated asset not found.'));
          return;
        }

        const asset = assets[assetIndex];
        const currentUser = MockDatabase.getCurrentUser();
        if (!currentUser) {
          reject(new Error('Authentication required.'));
          return;
        }

        // Auth check: approval/rejection and technician assignment can only be done by managers or admins
        if (currentUser.role !== 'Admin' && currentUser.role !== 'Asset Manager') {
          reject(new Error('Permission denied. Only Admins or Asset Managers can update ticket workflows.'));
          return;
        }

        // Updated request
        const updatedRequest: MaintenanceRequest = {
          ...request,
          status,
          technicianName: updates?.technicianName || request.technicianName,
          notes: updates?.notes || request.notes,
          cost: updates?.cost !== undefined ? updates.cost : request.cost,
          actionedDate: new Date().toISOString()
        };

        list[index] = updatedRequest;
        MockDatabase.saveMaintenance(list);

        // Core business rule: Auto-update asset lifecycle state based on maintenance stage
        let updatedAsset: Asset = { ...asset };
        let historyTitle = 'Maintenance Updated';
        let historyDesc = `Repair ticket status updated to "${status}" by ${currentUser.name}.`;

        if (status === 'Approved') {
          // Asset shifts to Under Maintenance when repair is officially approved
          updatedAsset.status = 'Under Maintenance';
          historyTitle = 'Asset Moved to Repair';
          historyDesc = `Asset approved for repair. Shifted lifecycle state to Under Maintenance.`;
          
          MockDatabase.addNotification(
            'Maintenance Approved',
            `Repair request for "${asset.name}" has been approved.`,
            'Maintenance Approved'
          );
        } else if (status === 'Rejected') {
          // If rejected, does not change asset status unless it was already marked as something else,
          // usually goes back or stays same.
          historyTitle = 'Maintenance Rejected';
          historyDesc = `Repair request rejected by ${currentUser.name}. Reason/Notes: ${updates?.notes || 'None'}`;

          MockDatabase.addNotification(
            'Maintenance Rejected',
            `Repair request for "${asset.name}" has been rejected.`,
            'Maintenance Rejected'
          );
        } else if (status === 'Resolved') {
          // Revert asset status back to Available upon successful repair resolution
          updatedAsset.status = 'Available';
          historyTitle = 'Maintenance Resolved';
          historyDesc = `Repair completed by ${updatedRequest.technicianName || 'Technician'}. Cost: $${updatedRequest.cost || 0}. Notes: ${updates?.notes || 'None'}. Asset returned to Available.`;

          MockDatabase.addNotification(
            'Maintenance Completed',
            `Asset "${asset.name}" is fully repaired and returned to active service.`,
            'Asset Assigned'
          );
        }

        // Save updated asset
        assets[assetIndex] = updatedAsset;
        MockDatabase.saveAssets(assets);

        // Add history log to asset history
        const historyItem: AssetHistory = {
          id: MockDatabase.generateId('h'),
          assetId: request.assetId,
          type: 'Maintenance',
          title: historyTitle,
          description: historyDesc,
          actorId: currentUser.id,
          actorName: currentUser.name,
          date: new Date().toISOString(),
          notes: updates?.notes
        };
        MockDatabase.saveHistory([historyItem, ...MockDatabase.getHistory()]);

        MockDatabase.logAction(
          currentUser.id, 
          currentUser.name, 
          'Update Maintenance', 
          `Updated repair ticket status of ${asset.name} to ${status}`
        );

        resolve(updatedRequest);
      }, DELAY);
    });
  }
};
