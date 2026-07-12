import * as React from 'react';
import { ClipboardCheck, ShieldAlert, CheckCircle, AlertTriangle, Plus, Lock, RefreshCw, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { assetService } from '../services/asset.service';
import { MockDatabase } from '../services/mockDb';
import { AuditCycle, AuditItem, Asset } from '../types';
import toast from 'react-hot-toast';

// ==============================
// BACKEND INTEGRATION
// Page: Compliance Auditing & Verification Dashboard
//
// API Endpoints Required:
// 1. GET /api/audits
//    - Authentication: JWT Required (Admin/Manager Only)
//    - Response: AuditCycle[]
// 
// 2. GET /api/audit-items?cycleId=:cycleId
//    - Authentication: JWT Required
//    - Response: AuditItem[]
// 
// 3. POST /api/audits
//    - Authentication: JWT Required (Admin Only)
//    - Request Body: { name: string, assignedAuditorIds: string[] }
//    - Response: AuditCycle
// 
// 4. PUT /api/audit-items/:id
//    - Authentication: JWT Required (Auditor/Manager Only)
//    - Request Body: { status: 'Verified' | 'Missing' | 'Damaged', notes?: string }
//    - Response: AuditItem
// 
// 5. POST /api/audits/:id/close
//    - Authentication: JWT Required (Admin Only)
//    - Response: { success: true }
//
// Error Handling:
// - Standard 401: Unauthorized (Redirect to login)
// - Standard 403: Forbidden (Unauthorized write attempts)
// - Standard 400: Bad Request (Attempting to start active audits with active loops running)
// ==============================

export const AssetAuditPage: React.FC = () => {
  // TODO(BACKEND):
  // Replace with API response from GET /api/audits
  const [audits, setAudits] = React.useState<AuditCycle[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/audit-items
  const [auditItems, setAuditItems] = React.useState<AuditItem[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/assets
  const [assets, setAssets] = React.useState<Asset[]>([]);

  const [activeCycle, setActiveCycle] = React.useState<AuditCycle | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Form states
  const [showForm, setShowForm] = React.useState(false);
  const [auditName, setAuditName] = React.useState('');
  const [scopeId, setScopeId] = React.useState('');

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const allAudits = MockDatabase.getAudits();
      const allAuditItems = MockDatabase.getAuditItems();
      const allAssets = await assetService.getAssets();

      setAudits(allAudits);
      setAuditItems(allAuditItems);
      setAssets(allAssets);

      const active = allAudits.find(a => a.status === 'Active');
      if (active) setActiveCycle(active);
    } catch (e) {
      toast.error('Failed to load audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadAuditLogs();
  }, []);

  // BACKEND API
  // Method: POST
  // Endpoint: /api/audits
  // Authentication: JWT Required (Admin Only)
  // Request DTO: { name: string, scopeType: 'All', assignedAuditorIds: string[] }
  // Response DTO: AuditCycle
  // Expected Status Codes: 201 Created, 400 Bad Request (If cycle active exists), 403 Forbidden
  const handleCreateAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditName.trim()) {
      toast.error('Audit cycle name is required.');
      return;
    }

    const currentAudits = MockDatabase.getAudits();
    const activeExists = currentAudits.some(a => a.status === 'Active');
    if (activeExists) {
      toast.error('An active audit cycle is already in progress. Please close it first.');
      return;
    }

    const newCycle: AuditCycle = {
      id: MockDatabase.generateId('aud'),
      name: auditName,
      scopeType: 'All',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedAuditorIds: ['emp-2'],
      status: 'Active'
    };

    // Save cycle
    MockDatabase.saveAudits([newCycle, ...currentAudits]);

    // Generate audit items for all active assets
    const activeAssets = assets.filter(a => a.status !== 'Retired' && a.status !== 'Disposed');
    const newItems: AuditItem[] = activeAssets.map(a => ({
      id: MockDatabase.generateId('aui'),
      auditCycleId: newCycle.id,
      assetId: a.id,
      status: 'Pending'
    }));

    MockDatabase.saveAuditItems([...newItems, ...MockDatabase.getAuditItems()]);
    toast.success(`Audit cycle "${auditName}" is now active!`);
    
    // Reset
    setAuditName('');
    setShowForm(false);
    loadAuditLogs();
  };

  // BACKEND API
  // Method: PUT
  // Endpoint: /api/audit-items/:id
  // Authentication: JWT Required (Auditor/Manager Only)
  // Request DTO: { status: 'Verified' | 'Missing' | 'Damaged', notes?: string }
  // Response DTO: AuditItem
  // Expected Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found
  const handleMarkItem = (itemId: string, status: 'Verified' | 'Missing' | 'Damaged') => {
    const items = MockDatabase.getAuditItems();
    const idx = items.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      items[idx] = {
        ...items[idx],
        status,
        verifiedDate: new Date().toISOString(),
        auditorId: 'emp-2', // mock manager audit
        notes: `Marked as ${status} during physical audit sweep.`
      };
      MockDatabase.saveAuditItems(items);
      toast.success(`Asset marked as ${status}.`);
      loadAuditLogs();
    }
  };

  // BACKEND API
  // Method: POST
  // Endpoint: /api/audits/:id/close
  // Authentication: JWT Required (Admin Only)
  // Expected Status Codes: 200 OK, 403 Forbidden, 404 Not Found
  const handleCloseAuditCycle = () => {
    if (!activeCycle) return;

    const currentAudits = MockDatabase.getAudits();
    const cycleIdx = currentAudits.findIndex(a => a.id === activeCycle.id);
    if (cycleIdx === -1) return;

    // Lock cycle
    currentAudits[cycleIdx] = {
      ...currentAudits[cycleIdx],
      status: 'Completed',
      closedDate: new Date().toISOString().split('T')[0]
    };
    MockDatabase.saveAudits(currentAudits);

    // Apply discrepancy statuses to Assets
    const activeItems = auditItems.filter(i => i.auditCycleId === activeCycle.id);
    const allAssets = MockDatabase.getAssets();

    activeItems.forEach(item => {
      const assetIdx = allAssets.findIndex(a => a.id === item.assetId);
      if (assetIdx !== -1) {
        if (item.status === 'Missing') {
          allAssets[assetIdx].status = 'Lost';
          MockDatabase.addNotification(
            'Audit Discrepancy Flagged',
            `Asset "${allAssets[assetIdx].name}" was reported missing in "${activeCycle.name}" and status has been updated to Lost.`,
            'Audit Discrepancy Flagged'
          );
        } else if (item.status === 'Damaged') {
          // Send report alert
          MockDatabase.addNotification(
            'Audit Discrepancy Flagged',
            `Asset "${allAssets[assetIdx].name}" was flagged as damaged in "${activeCycle.name}". Repair ticket requested.`,
            'Audit Discrepancy Flagged'
          );
        }
      }
    });

    MockDatabase.saveAssets(allAssets);
    MockDatabase.logAction('emp-2', 'Sarah Connor', 'Close Audit Cycle', `Closed audit cycle "${activeCycle.name}".`);
    toast.success('Audit cycle locked. Discrepancy and asset statuses synchronized.');
    setActiveCycle(null);
    loadAuditLogs();
  };

  const getAssetName = (id: string) => {
    const asset = assets.find(a => a.id === id);
    return asset ? `${asset.name} (${asset.assetTag})` : 'Unknown Asset';
  };

  const getActiveCycleItems = () => {
    if (!activeCycle) return [];
    return auditItems.filter(i => i.auditCycleId === activeCycle.id);
  };

  if (isLoading) {
    return <div className="text-center py-20 text-xs font-bold text-brand-muted uppercase tracking-wider">Syncing verification audits...</div>;
  }

  const cycleItems = getActiveCycleItems();
  const pendingCount = cycleItems.filter(i => i.status === 'Pending').length;
  const verifiedCount = cycleItems.filter(i => i.status === 'Verified').length;
  const missingCount = cycleItems.filter(i => i.status === 'Missing').length;
  const damagedCount = cycleItems.filter(i => i.status === 'Damaged').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">Compliance Auditing</h1>
          <p className="text-xs text-brand-muted">Initiate structured hardware verification loops, audit discrepancies, and lock asset ledger sheets.</p>
        </div>
        {!activeCycle && (
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-1" />
            {showForm ? 'Cancel Audit' : 'Initiate Audit Cycle'}
          </Button>
        )}
      </div>

      {/* Audit Scheduler form */}
      {showForm && (
        <Card className="border-brand-primary/20 bg-brand-primary/5 animate-slide-down">
          <CardHeader>
            <CardTitle className="text-xs">Schedule Physical Inventory Verification Cycle</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {/* TODO(BACKEND): Handle Form Submission for Audit Cycle creation */}
            <form onSubmit={handleCreateAudit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <Input
                label="Audit Cycle Name *"
                placeholder="e.g. FY26 Q3 Marketing Lab Audit"
                value={auditName}
                onChange={(e) => setAuditName(e.target.value)}
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-brand-text/80 uppercase tracking-wider">Assigned Auditor *</label>
                <select className="w-full px-3.5 py-2 text-sm bg-white border border-brand-border rounded-lg outline-none focus:border-brand-primary">
                  <option value="emp-2">Sarah Connor (Asset Manager)</option>
                  <option value="emp-1">Alexander Wright (Admin)</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="w-full cursor-pointer font-bold">Launch Verification Loop</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Grid: Active Audit (Left), Discrepancies stats (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Audit Sweep Screen */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Active Audit sweep sheet</span>
            {activeCycle && (
              <Badge variant="warning">
                Cycle: {activeCycle.name}
              </Badge>
            )}
          </div>

          {!activeCycle ? (
            <Card className="bg-white border-dashed border-brand-border p-12 text-center flex flex-col items-center gap-3">
              <CheckCircle className="h-10 w-10 text-brand-success" />
              <strong className="text-xs font-bold text-brand-text uppercase tracking-wider">All Assets Compliant & Locked</strong>
              <p className="text-xs text-brand-muted">No active physical verification cycles. Lock sheets are fully up-to-date.</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Progress metrics header card */}
              <Card className="bg-white">
                <CardContent className="p-5 grid grid-cols-4 gap-4 text-center">
                  <div className="flex flex-col gap-0.5 border-r border-brand-border">
                    <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wide">Pending Checks</span>
                    <strong className="text-xl font-extrabold text-brand-text">{pendingCount}</strong>
                  </div>
                  <div className="flex flex-col gap-0.5 border-r border-brand-border">
                    <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wide">Verified</span>
                    <strong className="text-xl font-extrabold text-brand-success">{verifiedCount}</strong>
                  </div>
                  <div className="flex flex-col gap-0.5 border-r border-brand-border">
                    <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wide">Missing</span>
                    <strong className="text-xl font-extrabold text-brand-danger">{missingCount}</strong>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wide">Damaged</span>
                    <strong className="text-xl font-extrabold text-brand-warning">{damagedCount}</strong>
                  </div>
                </CardContent>
              </Card>

              {/* Items checklist table */}
              {/* ==============================
                  BACKEND INTEGRATION
                  Table Render: Audit Items checklist
                  Endpoint: GET /api/audit-items?cycleId=:cycleId
                  Returns: AuditItem[]
                  ============================== */}
              <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-brand-border">
                  <thead className="bg-gray-50 font-bold text-brand-muted uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3.5">Asset</th>
                      <th className="px-6 py-3.5">Audit Status</th>
                      <th className="px-6 py-3.5 text-right">Physical Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border text-brand-text">
                    {cycleItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3.5 font-semibold">
                          {getAssetName(item.assetId)}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant={
                            item.status === 'Verified' ? 'status-available' :
                            item.status === 'Missing' ? 'status-lost' :
                            item.status === 'Damaged' ? 'status-maintenance' : 'muted'
                          }>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {item.status === 'Pending' ? (
                            <div className="flex justify-end gap-1.5">
                              {/* TODO(BACKEND): Mark Verified action */}
                              <Button 
                                size="sm" 
                                variant="primary" 
                                className="!px-2 !py-1 text-[10px] cursor-pointer"
                                onClick={() => handleMarkItem(item.id, 'Verified')}
                              >
                                Verified
                              </Button>
                              {/* TODO(BACKEND): Mark Missing action */}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="!px-2 !py-1 text-[10px] text-brand-danger hover:bg-rose-50 cursor-pointer"
                                onClick={() => handleMarkItem(item.id, 'Missing')}
                              >
                                Missing
                              </Button>
                              {/* TODO(BACKEND): Mark Damaged action */}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="!px-2 !py-1 text-[10px] text-brand-warning hover:bg-amber-50 cursor-pointer"
                                onClick={() => handleMarkItem(item.id, 'Damaged')}
                              >
                                Damaged
                              </Button>
                            </div>
                          ) : (
                            /* TODO(BACKEND): Reset item status action */
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-[10px] text-brand-muted cursor-pointer"
                              onClick={() => {
                                // reset state
                                const items = MockDatabase.getAuditItems();
                                const idx = items.findIndex(i => i.id === item.id);
                                if (idx !== -1) {
                                  items[idx].status = 'Pending';
                                  MockDatabase.saveAuditItems(items);
                                  loadAuditLogs();
                                }
                              }}
                            >
                              Reset Checklist
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Lock Controls Side column */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Close & Synchronization Lock</span>
          
          {activeCycle ? (
            <Card className="bg-white">
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-1.5 font-bold text-brand-text border-b pb-2 text-xs uppercase tracking-wide">
                  <Lock className="h-4 w-4 text-brand-primary" />
                  <span>Lock Sweep Registry</span>
                </div>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Closing this audit cycle locks verification checklists into legal records. Affected assets marked as missing flip to **Lost** instantly.
                </p>
                {/* TODO(BACKEND): Lock & sync status post action */}
                <Button 
                  variant="secondary" 
                  size="sm" 
                  disabled={pendingCount > 0} 
                  onClick={handleCloseAuditCycle}
                  className="w-full cursor-pointer text-xs font-bold"
                >
                  {pendingCount > 0 ? `Unverified Checks Exist (${pendingCount})` : 'Lock Ledger & Snyc Statuses'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white">
              <CardContent className="p-5 flex flex-col gap-3 text-xs text-brand-muted">
                <div className="flex items-center gap-1.5 font-bold text-brand-text border-b pb-2 uppercase tracking-wider">
                  <ClipboardCheck className="h-4 w-4 text-brand-success" />
                  <span>Previous Cycles Log</span>
                </div>
                {/* ==============================
                    BACKEND INTEGRATION
                    List Render: Historical Audits List
                    Endpoint: GET /api/audits
                    Returns: AuditCycle[] (filter by Completed)
                    ============================== */}
                {audits.filter(a => a.status === 'Completed').length === 0 ? (
                  <span>No historical loops logged.</span>
                ) : (
                  audits.filter(a => a.status === 'Completed').map(a => (
                    <div key={a.id} className="flex justify-between items-center text-[11px] border-b border-brand-border/40 pb-2">
                      <div className="flex flex-col">
                        <strong className="text-brand-text font-semibold">{a.name}</strong>
                        <span>Closed: {a.closedDate}</span>
                      </div>
                      <Badge variant="status-available">Locked</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
};
export default AssetAuditPage;
