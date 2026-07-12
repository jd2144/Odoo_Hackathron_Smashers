import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardCheck, CheckCircle, Plus, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { assetService } from '../services/asset.service';
import { auditApi } from '../api/auditApi';
import { AuditCycle, AuditItem, Asset } from '../types';
import toast from 'react-hot-toast';

export const AssetAuditPage: React.FC = () => {
  const [audits, setAudits] = React.useState<AuditCycle[]>([]);
  const [auditItems, setAuditItems] = React.useState<AuditItem[]>([]);
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [activeCycle, setActiveCycle] = React.useState<AuditCycle | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Form states
  const [showForm, setShowForm] = React.useState(false);
  const [auditName, setAuditName] = React.useState('');

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const allAudits = await auditApi.getAudits();
      let allAuditItems: AuditItem[] = [];
      try {
        allAuditItems = await auditApi.getAuditItems();
      } catch {
        // Fallback or empty audit items
      }
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

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditName.trim()) {
      toast.error('Audit cycle name is required.');
      return;
    }

    const currentAudits = audits;
    const activeExists = currentAudits.some(a => a.status === 'Active');
    if (activeExists) {
      toast.error('An active audit cycle is already in progress. Please close it first.');
      return;
    }

    try {
      await auditApi.createAudit(auditName);
      toast.success(`Audit cycle "${auditName}" is now active!`);
      setAuditName('');
      setShowForm(false);
      loadAuditLogs();
    } catch {
      toast.error('Failed to start new audit cycle.');
    }
  };

  const handleMarkItem = async (itemId: string, status: 'Verified' | 'Missing' | 'Damaged') => {
    if (!activeCycle) return;
    try {
      await auditApi.scanAuditItem(activeCycle.id, itemId, status);
      toast.success(`Asset marked as ${status}.`);
      loadAuditLogs();
    } catch {
      toast.error('Failed to register audit scan.');
    }
  };

  const handleCloseAuditCycle = async () => {
    if (!activeCycle) return;

    try {
      await auditApi.closeAudit(activeCycle.id);
      toast.success('Audit cycle locked. Discrepancy and asset statuses synchronized.');
      setActiveCycle(null);
      loadAuditLogs();
    } catch {
      toast.error('Failed to close audit cycle.');
    }
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
    return (
      <div className="text-center py-24 text-[10px] font-black text-sahara-gold uppercase tracking-widest">
        Syncing verification audits...
      </div>
    );
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
          <h1 className="text-2xl font-black tracking-tight text-sahara-coffee">Compliance Auditing</h1>
          <p className="text-xs text-sahara-clay/70 font-semibold leading-relaxed">Initiate structured physical hardware verification loops, audit discrepancy files, and lock asset ledger records.</p>
        </div>
        {!activeCycle && (
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="cursor-pointer rounded-xl text-xs uppercase tracking-wider font-bold">
            <Plus className="h-4 w-4 mr-1.5" />
            {showForm ? 'Cancel Audit' : 'Initiate Audit Cycle'}
          </Button>
        )}
      </div>

      {/* Audit Scheduler form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -15 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          className="overflow-hidden"
        >
          <Card className="border-sahara-sand/35 bg-sahara-light/20 shadow-md">
            <CardHeader>
              <CardTitle className="text-[10px]">Schedule Physical Inventory Verification Cycle</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateAudit} className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
                <Input
                  label="Audit Cycle Name *"
                  placeholder="e.g. FY26 Q3 Marketing Lab Audit"
                  value={auditName}
                  className="bg-white/60"
                  onChange={(e) => setAuditName(e.target.value)}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-sahara-clay/90 uppercase tracking-widest pl-0.5">Assigned Auditor *</label>
                  <select className="w-full px-4 py-2.5 text-sm bg-white/60 border border-sahara-sand/35 rounded-xl outline-none focus:border-sahara-gold focus:ring-4 focus:ring-sahara-gold/10 text-sahara-coffee font-semibold cursor-pointer transition-all">
                    <option value="emp-2">Sarah Connor (Asset Manager)</option>
                    <option value="emp-1">Alexander Wright (Admin)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="w-full cursor-pointer text-xs font-extrabold uppercase tracking-wider rounded-xl py-3">Launch Verification Loop</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Grid: Active Audit (Left), Discrepancies stats (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Audit Sweep Screen */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-sahara-clay/60 uppercase tracking-widest pl-0.5 font-sans">Active Audit sweep sheet</span>
            {activeCycle && (
              <Badge variant="warning" className="font-extrabold py-0.5">
                Cycle: {activeCycle.name}
              </Badge>
            )}
          </div>

          {!activeCycle ? (
            <Card className="bg-white/50 border-dashed border-sahara-sand/30 p-12 text-center flex flex-col items-center gap-4 shadow-sm rounded-2xl">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center border border-emerald-500/20 shadow-xs">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <strong className="text-xs font-black text-sahara-coffee uppercase tracking-widest">All Assets Compliant & Locked</strong>
                <p className="text-xs text-sahara-clay/70 max-w-xs mx-auto leading-relaxed font-semibold">No active physical verification cycles are pending. Lock sheets are fully up-to-date and signed off.</p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Progress metrics header card */}
              <Card className="bg-white/60 backdrop-blur-md border border-sahara-sand/15">
                <CardContent className="p-6 grid grid-cols-4 gap-4 text-center">
                  <div className="flex flex-col gap-0.5 border-r border-sahara-sand/15">
                    <span className="text-[9px] text-sahara-clay/60 uppercase font-black tracking-widest">Pending</span>
                    <strong className="text-2xl font-black text-sahara-coffee">{pendingCount}</strong>
                  </div>
                  <div className="flex flex-col gap-0.5 border-r border-sahara-sand/15">
                    <span className="text-[9px] text-emerald-600/70 uppercase font-black tracking-widest">Verified</span>
                    <strong className="text-2xl font-black text-emerald-700">{verifiedCount}</strong>
                  </div>
                  <div className="flex flex-col gap-0.5 border-r border-sahara-sand/15">
                    <span className="text-[9px] text-sahara-danger/70 uppercase font-black tracking-widest">Missing</span>
                    <strong className="text-2xl font-black text-sahara-danger">{missingCount}</strong>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-sahara-warning/70 uppercase font-black tracking-widest">Damaged</span>
                    <strong className="text-2xl font-black text-sahara-warning">{damagedCount}</strong>
                  </div>
                </CardContent>
              </Card>

              {/* Items checklist table */}
              <div className="bg-white/75 backdrop-blur-md border border-sahara-sand/15 rounded-2xl shadow-lg overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-sahara-sand/10 min-w-[500px]">
                  <thead className="bg-sahara-light/30 font-bold text-sahara-clay uppercase tracking-widest text-[9px] border-b border-sahara-sand/15">
                    <tr>
                      <th className="px-6 py-4.5">Asset</th>
                      <th className="px-6 py-4.5">Audit Status</th>
                      <th className="px-6 py-4.5 text-right">Physical Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sahara-sand/10 text-sahara-coffee font-semibold">
                    {cycleItems.map((item, index) => (
                      <motion.tr 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        key={item.id} 
                        className="luxury-table-row hover:bg-sahara-sand/5"
                      >
                        <td className="px-6 py-4 font-extrabold text-sahara-coffee">
                          {getAssetName(item.assetId)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={
                            item.status === 'Verified' ? 'status-available' :
                            item.status === 'Missing' ? 'status-lost' :
                            item.status === 'Damaged' ? 'status-maintenance' : 'muted'
                          }>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.status === 'Pending' ? (
                            <div className="flex justify-end gap-1.5">
                              <Button 
                                size="sm" 
                                variant="primary" 
                                className="!px-3 !py-1.5 text-[9px] uppercase tracking-wider font-extrabold cursor-pointer rounded-lg shadow-sm"
                                onClick={() => handleMarkItem(item.id, 'Verified')}
                              >
                                Verify
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="!px-3 !py-1.5 text-[9px] uppercase tracking-wider font-extrabold text-sahara-danger border-sahara-danger/25 hover:bg-sahara-danger/10 rounded-lg cursor-pointer"
                                onClick={() => handleMarkItem(item.id, 'Missing')}
                              >
                                Missing
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="!px-3 !py-1.5 text-[9px] uppercase tracking-wider font-extrabold text-sahara-warning border-sahara-warning/30 hover:bg-sahara-warning/10 rounded-lg cursor-pointer"
                                onClick={() => handleMarkItem(item.id, 'Damaged')}
                              >
                                Damaged
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-[9px] uppercase font-black tracking-widest text-sahara-clay/60 hover:text-sahara-coffee cursor-pointer"
                              onClick={async () => {
                                if (!activeCycle) return;
                                try {
                                  await auditApi.scanAuditItem(activeCycle.id, item.id, 'Pending');
                                  loadAuditLogs();
                                } catch {
                                  toast.error('Failed to reset checklist item.');
                                }
                              }}
                            >
                              Reset Checklist
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Lock Controls Side column */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <span className="text-[10px] font-black text-sahara-clay/60 uppercase tracking-widest pl-0.5">Close & Synchronization Lock</span>
          
          {activeCycle ? (
            <Card className="bg-white/80 shadow-md">
              <CardContent className="p-6 flex flex-col gap-4.5">
                <div className="flex items-center gap-2 font-black text-sahara-coffee border-b border-sahara-sand/10 pb-3 text-[10px] uppercase tracking-widest">
                  <Lock className="h-4 w-4 text-sahara-gold" />
                  <span>Lock Sweep Registry</span>
                </div>
                <p className="text-xs text-sahara-clay/80 leading-relaxed font-semibold">
                  Closing this active audit cycle locks physical verification checklists into permanent compliance records. Affected assets marked as missing will flip to <span className="font-bold text-sahara-danger">Lost</span> status immediately.
                </p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  disabled={pendingCount > 0} 
                  onClick={handleCloseAuditCycle}
                  className="w-full cursor-pointer text-xs font-extrabold uppercase tracking-wider rounded-xl py-3 shadow-md"
                >
                  {pendingCount > 0 ? `Unverified Checks Exist (${pendingCount})` : 'Lock Ledger & Sync Status'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/80 shadow-md">
              <CardContent className="p-6 flex flex-col gap-4 text-xs text-sahara-clay/80">
                <div className="flex items-center gap-2 font-black text-sahara-coffee border-b border-sahara-sand/10 pb-3 uppercase tracking-widest text-[10px]">
                  <ClipboardCheck className="h-4 w-4 text-sahara-gold" />
                  <span>Previous Cycles Log</span>
                </div>
                
                {audits.filter(a => a.status === 'Completed').length === 0 ? (
                  <span className="text-center py-4 font-semibold text-sahara-clay/50">No historical loops logged.</span>
                ) : (
                  <div className="space-y-3 divide-y divide-sahara-sand/5">
                    {audits.filter(a => a.status === 'Completed').map(a => (
                      <div key={a.id} className="flex justify-between items-center text-[11px] pt-3 first:pt-0">
                        <div className="flex flex-col gap-0.5">
                          <strong className="text-sahara-coffee font-extrabold">{a.name}</strong>
                          <span className="text-sahara-clay/60 font-bold uppercase text-[9px] tracking-wider">Closed: {a.closedDate}</span>
                        </div>
                        <Badge variant="status-available" className="font-extrabold">Locked</Badge>
                      </div>
                    ))}
                  </div>
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
