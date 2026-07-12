import * as React from 'react';
import { Wrench, Plus, Check, ShieldAlert, XCircle, ChevronRight, AlertTriangle, UserCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { maintenanceService } from '../services/maintenance.service';
import { assetService } from '../services/asset.service';
import { MaintenanceRequest, Asset } from '../types';
import toast from 'react-hot-toast';

// ==============================
// BACKEND INTEGRATION
// Page: Maintenance & Repair Tickets Kanban Dashboard
//
// API Endpoints Required:
// 1. GET /api/maintenance-requests
//    - Authentication: JWT Required
//    - Response: MaintenanceRequest[]
// 
// 2. POST /api/maintenance-requests
//    - Authentication: JWT Required
//    - Request Body: { assetId: string, description: string, priority: string }
//    - Response: MaintenanceRequest
// 
// 3. PUT /api/maintenance-requests/:id/status
//    - Authentication: JWT Required (Manager / Specialist roles)
//    - Request Body: { status: string, resolutionDetails?: { technicianName: string, cost: number, notes: string } }
//    - Response: MaintenanceRequest
// 
// 4. GET /api/assets
//    - Authentication: JWT Required (For asset picker list)
//    - Response: Asset[]
//
// Error Handling:
// - Standard 401: Unauthorized (Redirect to login)
// - Standard 403: Forbidden (Role constraint failures)
// - Standard 400: Bad Request (Invalid workflow status transitions)
// ==============================

export const MaintenancePage: React.FC = () => {
  // TODO(BACKEND):
  // Replace with API response from GET /api/maintenance-requests
  const [requests, setRequests] = React.useState<MaintenanceRequest[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/assets
  const [assets, setAssets] = React.useState<Asset[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);

  // Ticket creation states
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [selectedAssetId, setSelectedAssetId] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [priority, setPriority] = React.useState<MaintenanceRequest['priority']>('Medium');

  // Resolved ticket details capture inline
  const [resolvingTicketId, setResolvingTicketId] = React.useState<string | null>(null);
  const [techName, setTechName] = React.useState('');
  const [repairCost, setRepairCost] = React.useState('');
  const [repairNotes, setRepairNotes] = React.useState('');

  const loadMaintenancePool = async () => {
    setIsLoading(true);
    try {
      const [allRequests, allAssets] = await Promise.all([
        maintenanceService.getMaintenanceRequests(),
        assetService.getAssets()
      ]);
      setRequests(allRequests);
      setAssets(allAssets);
    } catch (e) {
      toast.error('Failed to load repair logs.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadMaintenancePool();
  }, []);

  // BACKEND API
  // Method: POST
  // Endpoint: /api/maintenance-requests
  // Authentication: JWT Required
  // Request DTO: { assetId: string, description: string, priority: string }
  // Response DTO: MaintenanceRequest
  // Expected Status Codes: 201 Created, 400 Bad Request
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !desc.trim()) {
      toast.error('Asset selection and issue description are required.');
      return;
    }

    try {
      await maintenanceService.createMaintenanceRequest(selectedAssetId, desc, priority);
      toast.success('Repair request submitted.');
      
      // Reset
      setSelectedAssetId('');
      setDesc('');
      setPriority('Medium');
      setShowAddForm(false);
      loadMaintenancePool();
    } catch (error: any) {
      toast.error(error.message || 'Ticket creation failed.');
    }
  };

  // BACKEND API
  // Method: PUT
  // Endpoint: /api/maintenance-requests/:id/status
  // Authentication: JWT Required (Manager / Specialist roles)
  // Request DTO: { status: MaintenanceRequest['status'], resolutionDetails?: any }
  // Response DTO: MaintenanceRequest
  // Expected Status Codes: 200 OK, 400 Bad Request, 403 Forbidden
  const handleUpdateStatus = async (id: string, nextStatus: MaintenanceRequest['status']) => {
    if (nextStatus === 'Resolved') {
      setResolvingTicketId(id);
      return;
    }

    try {
      await maintenanceService.updateRequestStatus(id, nextStatus);
      toast.success(`Ticket state advanced to: ${nextStatus}`);
      loadMaintenancePool();
    } catch (error: any) {
      toast.error(error.message || 'Workflow advancement failed.');
    }
  };

  // BACKEND API
  // Method: PUT
  // Endpoint: /api/maintenance-requests/:id/status
  // Authentication: JWT Required (Specialist / Manager)
  // Request DTO: { status: 'Resolved', resolutionDetails: { technicianName: string, cost: number, notes: string } }
  // Expected Status Codes: 200 OK, 400 Bad Request, 403 Forbidden
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicketId) return;

    try {
      await maintenanceService.updateRequestStatus(resolvingTicketId, 'Resolved', {
        technicianName: techName || 'General Contractor',
        cost: Number(repairCost) || 0,
        notes: repairNotes || 'Completed repair works.'
      });

      toast.success('Repair logged as fully resolved. Asset is back online.');
      setResolvingTicketId(null);
      setTechName('');
      setRepairCost('');
      setRepairNotes('');
      loadMaintenancePool();
    } catch (error: any) {
      toast.error(error.message || 'Resolution logging failed.');
    }
  };

  const getAssetName = (id: string) => {
    const asset = assets.find(a => a.id === id);
    return asset ? `${asset.name} (${asset.assetTag})` : 'Unknown Asset';
  };

  // Organize requests by column
  const getColTickets = (status: MaintenanceRequest['status']) => {
    return requests.filter(r => r.status === status);
  };

  const priorityBadgeVariant = (p: MaintenanceRequest['priority']) => {
    switch (p) {
      case 'Low': return 'priority-low';
      case 'Medium': return 'priority-medium';
      case 'High': return 'priority-high';
      case 'Critical': return 'priority-critical';
    }
  };

  if (isLoading) {
    return <div className="text-center py-20 text-xs font-bold text-brand-muted uppercase tracking-wider">Syncing repair dashboards...</div>;
  }

  const columns: { label: string; status: MaintenanceRequest['status'] }[] = [
    { label: 'Pending Approval', status: 'Pending' },
    { label: 'Approved Repairs', status: 'Approved' },
    { label: 'In Progress', status: 'In Progress' },
    { label: 'Resolved Tickets', status: 'Resolved' }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">Maintenance Repair Tickets</h1>
          <p className="text-xs text-brand-muted">Raise support tickets, approve repair work, assign specialists, and resolve asset down-states.</p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="cursor-pointer">
          <Wrench className="h-4 w-4 mr-1.5" />
          {showAddForm ? 'Cancel Ticket' : 'Raise Repair Ticket'}
        </Button>
      </div>

      {/* Ticket form */}
      {showAddForm && (
        <Card className="border-brand-primary/20 bg-brand-primary/5 animate-slide-down">
          <CardHeader>
            <CardTitle className="text-xs">Submit Asset Maintenance Ticket</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {/* TODO(BACKEND): Handle Ticket Creation Form Submission */}
            <form onSubmit={handleCreateRequest} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-brand-text/80 uppercase tracking-wider">Select Damaged Asset *</label>
                <select
                  className="w-full px-3.5 py-2 text-sm bg-white border border-brand-border rounded-lg outline-none focus:border-brand-primary"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  required
                >
                  <option value="">Select Asset...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.assetTag}) [Condition: {a.condition}]</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-brand-text/80 uppercase tracking-wider">Impact Priority *</label>
                <select
                  className="w-full px-3.5 py-2 text-sm bg-white border border-brand-border rounded-lg outline-none focus:border-brand-primary"
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  required
                >
                  <option value="Low">Low (Minor wear, usable)</option>
                  <option value="Medium">Medium (Defect, partially usable)</option>
                  <option value="High">High (Major fault, down state)</option>
                  <option value="Critical">Critical (Structural block, safety concern)</option>
                </select>
              </div>

              <Input
                label="Describe Defect/Fault *"
                placeholder="Static noise on mic, bulging battery, oil leak..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                required
              />

              <div className="sm:col-span-3 flex justify-end gap-2 border-t border-brand-border pt-4 mt-2">
                <Button type="submit" className="px-6 cursor-pointer">Log Support Request</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Kanban Column View */}
      {/* ==============================
          BACKEND INTEGRATION
          Kanban Board: Repair Stage Lists
          Endpoint: GET /api/maintenance-requests
          Returns: MaintenanceRequest[]
          ============================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {columns.map(col => {
          const tickets = getColTickets(col.status);
          return (
            <div key={col.status} className="flex flex-col gap-3 bg-gray-50 border border-brand-border/60 p-4 rounded-xl min-h-[300px]">
              <div className="flex items-center justify-between border-b pb-2 px-1">
                <span className="text-xs font-extrabold text-brand-text uppercase tracking-wide">{col.label}</span>
                <Badge variant="muted">{tickets.length}</Badge>
              </div>

              <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                {tickets.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-center text-[11px] text-brand-muted border border-dashed border-brand-border rounded-lg bg-white/50">
                    No tickets in this stage.
                  </div>
                ) : (
                  tickets.map(ticket => (
                    <Card key={ticket.id} className="bg-white hover:border-brand-primary/40">
                      <CardContent className="p-4 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <Badge variant={priorityBadgeVariant(ticket.priority)}>
                            {ticket.priority} Priority
                          </Badge>
                          <span className="text-[9px] font-mono font-bold text-brand-muted">{ticket.id}</span>
                        </div>
                        
                        <div className="flex flex-col">
                          <strong className="text-xs font-bold text-brand-text truncate leading-snug">{getAssetName(ticket.assetId)}</strong>
                          <p className="text-[11px] text-brand-muted line-clamp-2 mt-1 italic leading-tight">"{ticket.description}"</p>
                        </div>

                        <div className="border-t border-brand-border/60 pt-2.5 mt-1 flex flex-col gap-1 text-[10px] text-brand-muted">
                          <span>Reported: {new Date(ticket.createdDate).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1">
                            <UserCircle className="h-3 w-3 text-brand-muted" />
                            By: {ticket.reportedByName}
                          </span>
                        </div>

                        {/* Action buttons based on status (simulating workflow approvals) */}
                        <div className="flex justify-end gap-1 border-t border-brand-border/50 pt-2 mt-1">
                          {ticket.status === 'Pending' && (
                            <>
                              {/* TODO(BACKEND): Approve Repair trigger */}
                              <Button 
                                size="sm" 
                                variant="primary" 
                                className="!p-1 text-[10px] cursor-pointer"
                                onClick={() => handleUpdateStatus(ticket.id, 'Approved')}
                              >
                                Approve
                              </Button>
                              {/* TODO(BACKEND): Reject Repair trigger */}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="!p-1 text-[10px] text-brand-danger hover:bg-rose-50 cursor-pointer"
                                onClick={() => handleUpdateStatus(ticket.id, 'Rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {ticket.status === 'Approved' && (
                            /* TODO(BACKEND): Move to Repair trigger */
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="w-full text-[10px] cursor-pointer"
                              onClick={() => handleUpdateStatus(ticket.id, 'In Progress')}
                            >
                              Move to Repair
                            </Button>
                          )}
                          {ticket.status === 'In Progress' && (
                            /* TODO(BACKEND): Mark Resolved trigger (shows resolves form popup) */
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full text-[10px] font-bold border-brand-success text-brand-success hover:bg-emerald-50 cursor-pointer"
                              onClick={() => handleUpdateStatus(ticket.id, 'Resolved')}
                            >
                              Mark Resolved
                            </Button>
                          )}
                          {ticket.status === 'Resolved' && (
                            <div className="text-[10px] text-brand-success font-semibold flex items-center gap-1 p-1">
                              <Check className="h-3 w-3" />
                              Fixed & Restored
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolve Ticket Modal Form Drawer */}
      {resolvingTicketId && (
        <div className="fixed inset-0 bg-brand-text/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="bg-white border border-brand-border rounded-xl p-6 shadow-xl w-full max-w-sm flex flex-col gap-4 animate-scale-up">
            <h3 className="font-bold text-xs uppercase tracking-wide text-brand-text border-b pb-2.5">Finalize Repair Audit</h3>
            {/* TODO(BACKEND): Resolution Data Form Submit */}
            <form onSubmit={handleResolveSubmit} className="flex flex-col gap-3">
              <Input
                label="Repair Technician / Firm *"
                placeholder="e.g. John’s Apple Support"
                value={techName}
                onChange={(e) => setTechName(e.target.value)}
                required
              />
              <Input
                type="number"
                label="Associated Repairs Cost ($USD) *"
                placeholder="250"
                value={repairCost}
                onChange={(e) => setRepairCost(e.target.value)}
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-brand-text/80 uppercase tracking-wider">Resolution Notes *</label>
                <textarea
                  placeholder="Describe repair actions, parts swapped, calibration logs..."
                  className="w-full min-h-16 px-3 py-1.5 text-xs border border-brand-border rounded-lg focus:border-brand-primary outline-none"
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2 border-t pt-4">
                <Button size="sm" type="submit" className="cursor-pointer font-bold text-xs">Verify Restoration</Button>
                <Button size="sm" variant="outline" className="cursor-pointer text-xs" onClick={() => setResolvingTicketId(null)}>Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
export default MaintenancePage;
