import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, Check, UserCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { maintenanceService } from '../services/maintenance.service';
import { assetService } from '../services/asset.service';
import { MaintenanceRequest, Asset } from '../types';
import toast from 'react-hot-toast';

export const MaintenancePage: React.FC = () => {
  const [requests, setRequests] = React.useState<MaintenanceRequest[]>([]);
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

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !desc.trim()) {
      toast.error('Asset selection and issue description are required.');
      return;
    }

    try {
      await maintenanceService.createMaintenanceRequest(selectedAssetId, desc, priority);
      toast.success('Repair request submitted.');
      
      setSelectedAssetId('');
      setDesc('');
      setPriority('Medium');
      setShowAddForm(false);
      loadMaintenancePool();
    } catch (error: any) {
      toast.error(error.message || 'Ticket creation failed.');
    }
  };

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
    return (
      <div className="text-center py-24 text-[10px] font-black text-sahara-gold uppercase tracking-widest">
        Syncing repair dashboards...
      </div>
    );
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
          <h1 className="text-2xl font-black tracking-tight text-sahara-coffee">Maintenance Repair Tickets</h1>
          <p className="text-xs text-sahara-clay/70 font-semibold leading-relaxed">Raise support tickets, approve repair work, assign specialists, and resolve asset down-states.</p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="cursor-pointer rounded-xl text-xs uppercase tracking-wider font-bold">
          <Wrench className="h-4 w-4 mr-1.5" />
          {showAddForm ? 'Cancel Ticket' : 'Raise Repair Ticket'}
        </Button>
      </div>

      {/* Ticket form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          className="overflow-hidden"
        >
          <Card className="border-sahara-sand/35 bg-sahara-light/20 shadow-md">
            <CardHeader>
              <CardTitle className="text-[10px]">Submit Asset Maintenance Ticket</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateRequest} className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-sahara-clay/90 uppercase tracking-widest pl-0.5">Select Damaged Asset *</label>
                  <select
                    className="w-full px-4 py-2.5 text-sm bg-white/60 border border-sahara-sand/35 rounded-xl outline-none focus:border-sahara-gold focus:ring-4 focus:ring-sahara-gold/10 text-sahara-coffee font-semibold cursor-pointer transition-all"
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
                  <label className="text-[10px] font-bold text-sahara-clay/90 uppercase tracking-widest pl-0.5">Impact Priority *</label>
                  <select
                    className="w-full px-4 py-2.5 text-sm bg-white/60 border border-sahara-sand/35 rounded-xl outline-none focus:border-sahara-gold focus:ring-4 focus:ring-sahara-gold/10 text-sahara-coffee font-semibold cursor-pointer transition-all"
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
                  className="bg-white/60"
                  onChange={(e) => setDesc(e.target.value)}
                  required
                />

                <div className="sm:col-span-3 flex justify-end gap-2 border-t border-sahara-sand/15 pt-5 mt-2">
                  <Button type="submit" className="px-6 rounded-xl text-xs uppercase tracking-wider font-extrabold cursor-pointer">Log Support Request</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Kanban Column View */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {columns.map(col => {
          const tickets = getColTickets(col.status);
          return (
            <div key={col.status} className="flex flex-col gap-3.5 bg-sahara-light/20 border border-sahara-sand/15 p-4 rounded-2xl min-h-[400px]">
              <div className="flex items-center justify-between border-b border-sahara-sand/10 pb-2.5 px-1">
                <span className="text-[10px] font-black text-sahara-coffee uppercase tracking-widest">{col.label}</span>
                <Badge variant="muted" className="font-extrabold px-2 py-0.5">{tickets.length}</Badge>
              </div>

              <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                {tickets.length === 0 ? (
                  <div className="h-36 flex items-center justify-center text-center text-[10px] font-bold uppercase tracking-wider text-sahara-clay/40 border border-dashed border-sahara-sand/20 rounded-xl bg-white/40">
                    No tickets
                  </div>
                ) : (
                  tickets.map((ticket, index) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="silk-card bg-white/80 hover:border-sahara-gold/40 shadow-sm">
                        <CardContent className="p-4.5 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <Badge variant={priorityBadgeVariant(ticket.priority)}>
                              {ticket.priority} Priority
                            </Badge>
                            <span className="text-[9px] font-mono font-black text-sahara-clay/55 uppercase tracking-wider">{ticket.id}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <strong className="text-xs font-black text-sahara-coffee truncate leading-snug">{getAssetName(ticket.assetId)}</strong>
                            <p className="text-[11px] text-sahara-clay/80 font-medium line-clamp-2 mt-1.5 italic leading-relaxed">"{ticket.description}"</p>
                          </div>

                          <div className="border-t border-sahara-sand/10 pt-2.5 mt-1 flex flex-col gap-1 text-[10px] text-sahara-clay/65 font-semibold">
                            <span>Reported: {new Date(ticket.createdDate).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1">
                              <UserCircle className="h-3.5 w-3.5 text-sahara-gold" />
                              By: {ticket.reportedByName}
                            </span>
                          </div>

                          <div className="flex justify-end gap-1.5 border-t border-sahara-sand/10 pt-3 mt-1">
                            {ticket.status === 'Pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="primary" 
                                  className="!px-2.5 !py-1 text-[9px] uppercase tracking-wider font-extrabold cursor-pointer rounded-lg shadow-sm"
                                  onClick={() => handleUpdateStatus(ticket.id, 'Approved')}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="!px-2.5 !py-1 text-[9px] uppercase tracking-wider font-extrabold text-sahara-danger border-sahara-danger/25 hover:bg-sahara-danger/10 rounded-lg cursor-pointer"
                                  onClick={() => handleUpdateStatus(ticket.id, 'Rejected')}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {ticket.status === 'Approved' && (
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                className="w-full text-[9px] uppercase tracking-wider font-extrabold cursor-pointer rounded-lg shadow-xs"
                                onClick={() => handleUpdateStatus(ticket.id, 'In Progress')}
                              >
                                Move to Repair
                              </Button>
                            )}
                            {ticket.status === 'In Progress' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full text-[9px] uppercase tracking-wider font-black border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 rounded-lg cursor-pointer transition-all"
                                onClick={() => handleUpdateStatus(ticket.id, 'Resolved')}
                              >
                                Mark Resolved
                              </Button>
                            )}
                            {ticket.status === 'Resolved' && (
                              <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1 py-1">
                                <Check className="h-3.5 w-3.5" />
                                Fixed & Restored
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolve Ticket Modal Form Drawer: Redesigned with Glassmorphism */}
      <AnimatePresence>
        {resolvingTicketId && (
          <div className="fixed inset-0 bg-sahara-coffee/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white/95 backdrop-blur-lg border border-sahara-sand/35 rounded-2xl p-7 shadow-2xl w-full max-w-sm flex flex-col gap-4.5 text-left relative"
            >
              <h3 className="font-black text-sm uppercase tracking-wider text-sahara-coffee border-b border-sahara-sand/15 pb-3">Finalize Repair Audit</h3>
              
              <form onSubmit={handleResolveSubmit} className="flex flex-col gap-4">
                <Input
                  label="Repair Technician / Firm *"
                  placeholder="e.g. John’s Apple Support"
                  value={techName}
                  className="bg-white/60"
                  onChange={(e) => setTechName(e.target.value)}
                  required
                />
                <Input
                  type="number"
                  label="Associated Repairs Cost ($USD) *"
                  placeholder="250"
                  value={repairCost}
                  className="bg-white/60"
                  onChange={(e) => setRepairCost(e.target.value)}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-sahara-clay/90 uppercase tracking-widest">Resolution Notes *</label>
                  <textarea
                    placeholder="Describe repair actions, parts swapped, calibration logs..."
                    className="w-full min-h-16 px-4 py-2.5 text-xs bg-white/60 border border-sahara-sand/35 rounded-xl focus:border-sahara-gold focus:ring-4 focus:ring-sahara-gold/10 text-sahara-coffee font-semibold placeholder:text-sahara-clay/35 transition-all outline-none"
                    value={repairNotes}
                    onChange={(e) => setRepairNotes(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-sahara-sand/15">
                  <Button size="sm" type="submit" className="cursor-pointer font-black text-xs uppercase tracking-wider py-2.5 rounded-xl">Verify Restoration</Button>
                  <Button size="sm" variant="outline" className="cursor-pointer text-xs uppercase tracking-wider font-bold py-2.5 rounded-xl text-sahara-clay hover:text-sahara-coffee" onClick={() => setResolvingTicketId(null)}>Cancel</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default MaintenancePage;
