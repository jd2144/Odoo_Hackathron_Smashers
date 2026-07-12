import * as React from 'react';
import { FolderSync, Tag, User, Users, ClipboardCheck, ArrowRightLeft, AlertCircle, Clock, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { assetService } from '../services/asset.service';
import { Asset, AssetAllocation, TransferRequest, Employee, Department } from '../types';
import toast from 'react-hot-toast';

// ==============================
// BACKEND INTEGRATION
// Page: Asset Allocation & Ownership Transfers Dashboard
//
// API Endpoints Required:
// 1. GET /api/assets
//    - Authentication: JWT Required
//    - Response: Asset[]
// 
// 2. GET /api/employees
//    - Authentication: JWT Required
//    - Response: Employee[]
// 
// 3. GET /api/departments
//    - Authentication: JWT Required
//    - Response: Department[]
// 
// 4. GET /api/transfers
//    - Authentication: JWT Required
//    - Response: TransferRequest[]
// 
// 5. POST /api/allocations
//    - Authentication: JWT Required (Admin/Manager Only)
//    - Request Body: { assetId: string, holderId: string, holderType: 'Employee'|'Department', expectedReturnDate?: string }
//    - Response: AssetAllocation
// 
// 6. POST /api/transfers
//    - Authentication: JWT Required
//    - Request Body: { assetId: string, toEmployeeId: string, reason: string }
//    - Response: TransferRequest
// 
// 7. PUT /api/transfers/:id/approve
//    - Authentication: JWT Required (Admin/Manager Only)
//    - Response: { success: true }
// 
// 8. PUT /api/transfers/:id/reject
//    - Authentication: JWT Required (Admin/Manager Only)
//    - Response: { success: true }
// 
// 9. POST /api/assets/:id/return
//    - Authentication: JWT Required (Admin/Manager Only)
//    - Request Body: { notes: string, condition: string }
//    - Response: { success: true }
//
// Error Handling:
// - Standard 401: Unauthorized (Redirect to login)
// - Standard 403: Forbidden (Unauthorized asset managers)
// - Standard 409: Conflict (If asset is already allocated and double assignment is attempted)
// ==============================

export const AssetAllocationPage: React.FC = () => {
  // TODO(BACKEND):
  // Replace with API response from GET /api/allocations (or map GET /api/assets where status === 'Allocated')
  const [allocations, setAllocations] = React.useState<AssetAllocation[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/transfers
  const [transfers, setTransfers] = React.useState<TransferRequest[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/assets
  const [assets, setAssets] = React.useState<Asset[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/employees
  const [employees, setEmployees] = React.useState<Employee[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/departments
  const [departments, setDepartments] = React.useState<Department[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);

  // New allocation form
  const [showAllocForm, setShowAllocForm] = React.useState(false);
  const [selectedAssetId, setSelectedAssetId] = React.useState('');
  const [holderType, setHolderType] = React.useState<'Employee' | 'Department'>('Employee');
  const [holderId, setHolderId] = React.useState('');
  const [expectedReturn, setExpectedReturn] = React.useState('');

  // Allocation Conflict Capture state
  const [allocationConflict, setAllocationConflict] = React.useState<{
    assetId: string;
    assetName: string;
    holderName: string;
    holderId: string;
  } | null>(null);
  const [transferReason, setTransferReason] = React.useState('');

  // Return asset modal
  const [selectedAssetForReturn, setSelectedAssetForReturn] = React.useState<Asset | null>(null);
  const [returnNotes, setReturnNotes] = React.useState('');
  const [returnCondition, setReturnCondition] = React.useState<'New' | 'Good' | 'Fair' | 'Poor' | 'Broken'>('Good');

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [allAssets, allEmps, allDepts, allTransfers] = await Promise.all([
        assetService.getAssets(),
        assetService.getEmployees(),
        assetService.getDepartments(),
        assetService.getTransfers()
      ]);

      setAssets(allAssets);
      setEmployees(allEmps);
      setDepartments(allDepts);
      setTransfers(allTransfers);

      // Extract active allocations
      const activeAllocations = allAssets
        .filter(a => a.status === 'Allocated')
        .map(a => {
          const today = new Date().toISOString().split('T')[0];
          const isOverdue = a.expectedReturnDate ? a.expectedReturnDate < today : false;
          return {
            id: `alc-${a.id}`,
            assetId: a.id,
            employeeId: a.currentHolderType === 'Employee' ? a.currentHolderId : undefined,
            departmentId: a.currentHolderType === 'Department' ? a.currentHolderId : undefined,
            allocatedById: 'emp-2',
            allocatedDate: a.acquisitionDate, // simulated
            expectedReturnDate: a.expectedReturnDate,
            status: isOverdue ? 'Overdue' as const : 'Active' as const
          };
        });
      setAllocations(activeAllocations);
    } catch (e) {
      toast.error('Failed to load logistics allocations.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadAllData();
  }, []);

  // BACKEND API
  // Method: POST
  // Endpoint: /api/allocations
  // Authentication: JWT Required (Admin/Manager Only)
  // Request DTO: { assetId: string, holderId: string, holderType: 'Employee'|'Department', expectedReturnDate?: string }
  // Response DTO: AssetAllocation
  // Expected Status Codes: 201 Created, 400 Bad Request, 409 Conflict
  const handleCreateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !holderId) {
      toast.error('Please specify both an asset and target assignee.');
      return;
    }

    try {
      await assetService.allocateAsset(selectedAssetId, holderId, holderType, expectedReturn || undefined);
      toast.success('Asset allocation finalized.');
      
      // Reset form
      setSelectedAssetId('');
      setHolderId('');
      setExpectedReturn('');
      setShowAllocForm(false);
      loadAllData();
    } catch (err: any) {
      // Catch core validation double-allocation conflict!
      if (err.message && err.message.startsWith('CONFLICT:')) {
        const asset = assets.find(a => a.id === selectedAssetId);
        setAllocationConflict({
          assetId: selectedAssetId,
          assetName: asset ? asset.name : 'Asset',
          holderName: err.currentHolderName || 'Another user',
          holderId: err.currentHolderId || ''
        });
      } else {
        toast.error(err.message || 'Allocation failed.');
      }
    }
  };

  // BACKEND API
  // Method: POST
  // Endpoint: /api/transfers
  // Authentication: JWT Required
  // Request DTO: { assetId: string, toEmployeeId: string, reason: string }
  // Response DTO: TransferRequest
  // Expected Status Codes: 201 Created, 400 Bad Request, 404 Not Found
  const handleInitiateTransfer = async () => {
    if (!allocationConflict) return;

    try {
      const activeUser = employees.find(e => e.role === 'Employee' || e.role === 'Admin'); // mock
      if (!activeUser) return;

      await assetService.requestTransfer(allocationConflict.assetId, holderId, transferReason || 'Standard corporate operational shift.');
      toast.success('Transfer request logged. Pending manager approvals.');
      
      // Clear conflict states
      setAllocationConflict(null);
      setTransferReason('');
      setSelectedAssetId('');
      setHolderId('');
      setShowAllocForm(false);
      loadAllData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit transfer request.');
    }
  };

  // BACKEND API
  // Method: PUT
  // Endpoint: /api/transfers/:id/approve
  // Authentication: JWT Required (Admin/Manager Only)
  // Expected Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found
  const handleApproveTransfer = async (trId: string) => {
    try {
      await assetService.approveTransfer(trId);
      toast.success('Transfer request approved. Owner records synchronized.');
      loadAllData();
    } catch (error: any) {
      toast.error(error.message || 'Approval failed.');
    }
  };

  // BACKEND API
  // Method: PUT
  // Endpoint: /api/transfers/:id/reject
  // Authentication: JWT Required (Admin/Manager Only)
  // Expected Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found
  const handleRejectTransfer = async (trId: string) => {
    try {
      await assetService.rejectTransfer(trId);
      toast.success('Transfer request rejected.');
      loadAllData();
    } catch (error: any) {
      toast.error(error.message || 'Rejection failed.');
    }
  };

  // BACKEND API
  // Method: POST
  // Endpoint: /api/assets/:id/return
  // Authentication: JWT Required (Admin/Manager Only)
  // Request DTO: { notes: string, condition: string }
  // Expected Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found
  const handleCheckInAsset = async () => {
    if (!selectedAssetForReturn) return;

    try {
      await assetService.returnAsset(selectedAssetForReturn.id, returnNotes, returnCondition);
      toast.success('Asset successfully returned to inventory.');
      setSelectedAssetForReturn(null);
      setReturnNotes('');
      loadAllData();
    } catch (error: any) {
      toast.error(error.message || 'Check-in failed.');
    }
  };

  const getHolderLabel = (alc: AssetAllocation) => {
    if (alc.employeeId) {
      const emp = employees.find(e => e.id === alc.employeeId);
      return emp ? `${emp.name} (Staff)` : 'Staff Member';
    } else {
      const dept = departments.find(d => d.id === alc.departmentId);
      return dept ? `${dept.name} (Dept)` : 'Department';
    }
  };

  const getAssetName = (id: string) => {
    const asset = assets.find(a => a.id === id);
    return asset ? `${asset.name} (${asset.assetTag})` : 'Unknown Asset';
  };

  if (isLoading) {
    return <div className="text-center py-20 text-xs font-bold text-brand-muted uppercase tracking-wider">Syncing allocation registries...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">Asset Allocation & Transfers</h1>
          <p className="text-xs text-brand-muted">Track possession custody, audit overdue expectations, and process active transfer requests.</p>
        </div>
        <Button size="sm" onClick={() => setShowAllocForm(!showAllocForm)} className="cursor-pointer">
          <FolderSync className="h-4 w-4 mr-1.5" />
          {showAllocForm ? 'Cancel Form' : 'Allocate Asset'}
        </Button>
      </div>

      {/* Allocation Conflict Banner / Dialog */}
      {allocationConflict && (
        <Card className="border-brand-warning/30 bg-brand-warning/5 animate-fade-in p-5 flex flex-col gap-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-brand-warning flex-shrink-0" />
            <div className="flex flex-col">
              <strong className="text-brand-text text-sm">Allocation Overlap Conflict Detected</strong>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                The asset <span className="font-bold text-brand-text">"{allocationConflict.assetName}"</span> is currently held by <span className="font-bold text-brand-text">{allocationConflict.holderName}</span>. 
                Under strict inventory rules, an asset cannot be allocated twice. Would you like to initiate a formal **Transfer Request** instead?
              </p>
            </div>
          </div>
          {/* TODO(BACKEND): Conflict Resolution Form submission */}
          <div className="flex flex-col gap-2 max-w-lg">
            <input
              type="text"
              placeholder="State reason for transfer request..."
              className="px-3.5 py-1.5 text-xs bg-white border border-brand-border rounded-lg outline-none focus:border-brand-warning"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleInitiateTransfer} className="cursor-pointer font-semibold text-xs">
                Submit Transfer Request
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAllocationConflict(null)} className="cursor-pointer text-xs">
                Dismiss Conflict
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Allocation form */}
      {showAllocForm && !allocationConflict && (
        <Card className="border-brand-primary/20 bg-brand-primary/5 animate-slide-down">
          <CardHeader>
            <CardTitle className="text-xs">Asset Distribution Record Sheet</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {/* TODO(BACKEND): Handle Form submission for Allocation setups */}
            <form onSubmit={handleCreateAllocation} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-brand-text/80 uppercase tracking-wider">Select Asset *</label>
                <select
                  className="w-full px-3.5 py-2 text-sm bg-white border border-brand-border rounded-lg outline-none focus:border-brand-primary"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  required
                >
                  <option value="">Select Asset...</option>
                  {assets.filter(a => a.status === 'Available').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>
                  ))}
                  <option value="" disabled>--- Blocked / Allocated (Triggers conflict flow) ---</option>
                  {assets.filter(a => a.status === 'Allocated').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.assetTag}) [In possession]</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-brand-text/80 uppercase tracking-wider">Allocation Target *</label>
                <div className="flex border border-brand-border rounded-lg p-0.5 bg-white">
                  <button
                    type="button"
                    onClick={() => { setHolderType('Employee'); setHolderId(''); }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${holderType === 'Employee' ? 'bg-brand-primary text-white' : 'text-brand-muted'}`}
                  >
                    Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHolderType('Department'); setHolderId(''); }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${holderType === 'Department' ? 'bg-brand-primary text-white' : 'text-brand-muted'}`}
                  >
                    Department
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-brand-text/80 uppercase tracking-wider">Assignee ID *</label>
                <select
                  className="w-full px-3.5 py-2 text-sm bg-white border border-brand-border rounded-lg outline-none focus:border-brand-primary"
                  value={holderId}
                  onChange={(e) => setHolderId(e.target.value)}
                  required
                >
                  <option value="">Select Target...</option>
                  {holderType === 'Employee' 
                    ? employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)
                    : departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                  }
                </select>
              </div>

              <Input
                type="date"
                label="Expected Return Date"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
              />

              <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-2 border-t border-brand-border pt-4 mt-2">
                <Button type="submit" className="px-6 cursor-pointer">Finalize Assignment</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Grid split: Active Allocations (Left), Transfer Queue (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Possession List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Active Custody Allocations ({allocations.length})</span>
          
          {/* ==============================
              BACKEND INTEGRATION
              Table Render: Custody Allocations Log
              Endpoint: GET /api/assets (derived where status === 'Allocated')
              Returns: Asset[] (or GET /api/allocations returns AssetAllocation[])
              ============================== */}
          <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-brand-border">
              <thead className="bg-gray-50 font-bold text-brand-muted uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Asset</th>
                  <th className="px-6 py-3.5">Assigned To</th>
                  <th className="px-6 py-3.5">Expected Return</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-brand-text">
                {allocations.map(alc => {
                  const assetObj = assets.find(a => a.id === alc.assetId);
                  return (
                    <tr key={alc.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-semibold">{assetObj ? assetObj.name : 'Unknown Asset'}</span>
                          <span className="text-brand-primary font-mono text-[10px] font-bold mt-0.5">{assetObj?.assetTag}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-medium">{getHolderLabel(alc)}</td>
                      <td className="px-6 py-3.5 font-mono text-brand-muted">
                        {alc.expectedReturnDate ? new Date(alc.expectedReturnDate).toLocaleDateString() : 'Permanent / Unset'}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge variant={alc.status === 'Overdue' ? 'status-lost' : 'status-allocated'}>
                          {alc.status === 'Overdue' ? 'Overdue Return' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {/* TODO(BACKEND): Check-In Asset action */}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs font-bold text-brand-danger hover:bg-rose-50 cursor-pointer"
                          onClick={() => {
                            if (assetObj) {
                              setSelectedAssetForReturn(assetObj);
                            }
                          }}
                        >
                          Check In
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transfers Approval Queue */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Transfers Approvals Pool</span>

          {/* ==============================
              BACKEND INTEGRATION
              List Render: Ownership Transfer Requests
              Endpoint: GET /api/transfers
              Returns: TransferRequest[]
              ============================== */}
          <div className="space-y-4">
            {transfers.filter(t => t.status === 'Pending').length === 0 ? (
              <Card className="bg-white border-dashed border-brand-border">
                <CardContent className="p-8 text-center text-xs text-brand-muted">
                  No pending asset transfer requests.
                </CardContent>
              </Card>
            ) : (
              transfers.filter(t => t.status === 'Pending').map(tr => {
                const fromUser = employees.find(e => e.id === tr.fromEmployeeId)?.name || 'Previous Owner';
                const toUser = employees.find(e => e.id === tr.toEmployeeId)?.name || 'Recipient';
                return (
                  <Card key={tr.id} className="hover-lift bg-white">
                    <CardHeader className="p-4 border-b border-brand-border">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-brand-secondary">Ownership Transfer</span>
                        <Badge variant="warning">Approval Pending</Badge>
                      </div>
                      <CardTitle className="text-xs mt-1">{getAssetName(tr.assetId)}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col gap-3 text-xs leading-relaxed">
                      <div className="flex items-center justify-between font-medium text-brand-text">
                        <div className="flex flex-col">
                          <span className="text-brand-muted text-[10px] uppercase">From</span>
                          <span>{fromUser}</span>
                        </div>
                        <ArrowRightLeft className="h-4 w-4 text-brand-muted" />
                        <div className="flex flex-col items-end">
                          <span className="text-brand-muted text-[10px] uppercase">Recipient</span>
                          <span>{toUser}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 border border-brand-border p-2 rounded-lg text-[11px] text-brand-muted font-medium italic">
                        "{tr.reason}"
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-brand-border pt-3 mt-1">
                        {/* TODO(BACKEND): Approve Transfer button */}
                        <Button size="sm" variant="primary" onClick={() => handleApproveTransfer(tr.id)} className="cursor-pointer text-xs font-semibold">
                          Approve
                        </Button>
                        {/* TODO(BACKEND): Reject/Deny Transfer button */}
                        <Button size="sm" variant="outline" onClick={() => handleRejectTransfer(tr.id)} className="cursor-pointer text-xs font-semibold">
                          Deny
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Return Asset Check-In Drawer Modal */}
      {selectedAssetForReturn && (
        <div className="fixed inset-0 bg-brand-text/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="bg-white border border-brand-border rounded-xl p-6 shadow-xl w-full max-w-md flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-bold text-sm uppercase tracking-wide text-brand-text">Verify Asset Check-In</h3>
              <Badge variant="status-available">{selectedAssetForReturn.assetTag}</Badge>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-brand-muted uppercase font-bold tracking-wider">Asset Being Checked-In:</span>
              <strong className="text-brand-text text-sm">{selectedAssetForReturn.name}</strong>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-brand-text/80 uppercase tracking-wider">Returned Condition Status *</label>
              <select
                className="w-full px-3.5 py-1.5 text-xs bg-white border border-brand-border rounded-lg outline-none focus:border-brand-primary"
                value={returnCondition}
                onChange={(e: any) => setReturnCondition(e.target.value)}
              >
                <option value="New">New / Unused</option>
                <option value="Good">Good / Standard wear</option>
                <option value="Fair">Fair / Noticeable cosmetic scratches</option>
                <option value="Poor">Poor / Structural damage, lacks performance</option>
                <option value="Broken">Broken / Functional failure</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-brand-text/80 uppercase tracking-wider">Check-In Notes & Logs *</label>
              <textarea
                placeholder="Describe actual condition checks, missing accessories, cords, casing damage..."
                className="w-full min-h-20 px-3 py-2 text-xs border border-brand-border rounded-lg outline-none focus:border-brand-primary"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2 border-t pt-4">
              {/* TODO(BACKEND): Handle Check-In Form Submission */}
              <Button size="sm" variant="primary" onClick={handleCheckInAsset} className="cursor-pointer font-bold text-xs">
                Confirm Return Checklist
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedAssetForReturn(null)} className="cursor-pointer text-xs">
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
export default AssetAllocationPage;
