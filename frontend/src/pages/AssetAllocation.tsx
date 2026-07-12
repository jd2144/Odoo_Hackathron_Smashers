import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FolderSync, Tag, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { assetService } from '../services/asset.service';
import { Asset, AssetAllocation, TransferRequest, Employee, Department } from '../types';
import toast from 'react-hot-toast';

export const AssetAllocationPage: React.FC = () => {
  const [allocations, setAllocations] = React.useState<AssetAllocation[]>([]);
  const [transfers, setTransfers] = React.useState<TransferRequest[]>([]);
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
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
            allocatedDate: a.acquisitionDate,
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

  const handleInitiateTransfer = async () => {
    if (!allocationConflict) return;

    try {
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

  const handleApproveTransfer = async (trId: string) => {
    try {
      await assetService.approveTransfer(trId);
      toast.success('Transfer request approved. Owner records synchronized.');
      loadAllData();
    } catch (error: any) {
      toast.error(error.message || 'Approval failed.');
    }
  };

  const handleRejectTransfer = async (trId: string) => {
    try {
      await assetService.rejectTransfer(trId);
      toast.success('Transfer request rejected.');
      loadAllData();
    } catch (error: any) {
      toast.error(error.message || 'Rejection failed.');
    }
  };

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
    return (
      <div className="text-center py-24 text-[10px] font-black text-sahara-gold uppercase tracking-widest">
        Syncing allocation registries...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-sahara-coffee">Asset Allocation & Transfers</h1>
          <p className="text-xs text-sahara-clay/70 font-semibold leading-relaxed">Track possession custody, audit overdue expectations, and process active transfer requests.</p>
        </div>
        <Button size="sm" onClick={() => setShowAllocForm(!showAllocForm)} className="cursor-pointer rounded-xl text-xs uppercase tracking-wider font-bold">
          <FolderSync className="h-4 w-4 mr-1.5" />
          {showAllocForm ? 'Cancel Form' : 'Allocate Asset'}
        </Button>
      </div>

      {/* Allocation Conflict Banner / Dialog */}
      {allocationConflict && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border-sahara-warning/30 bg-sahara-warning/10 rounded-[22px] p-6 flex flex-col gap-5 shadow-sm"
        >
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-xl bg-sahara-warning/15 flex items-center justify-center text-sahara-warning flex-shrink-0 border border-sahara-warning/25">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <strong className="text-sahara-coffee text-sm font-extrabold">Allocation Overlap Conflict Detected</strong>
              <p className="text-xs text-[#7F5539]/90 mt-1 leading-relaxed font-semibold">
                The asset <span className="font-extrabold text-[#4E342E]">"{allocationConflict.assetName}"</span> is currently held by <span className="font-extrabold text-[#4E342E]">{allocationConflict.holderName}</span>. 
                Under strict inventory rules, an asset cannot be allocated twice. Would you like to initiate a formal <span className="font-extrabold text-sahara-gold">Transfer Request</span> instead?
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 max-w-lg pl-14">
            <input
              type="text"
              placeholder="State reason for transfer request..."
              className="w-full px-4 py-2 text-xs bg-white/60 border border-sahara-sand/25 rounded-xl outline-none focus:border-sahara-warning focus:ring-4 focus:ring-sahara-warning/10 transition-all font-semibold text-sahara-coffee placeholder:text-sahara-clay/40"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleInitiateTransfer} className="cursor-pointer font-bold text-[10px] uppercase tracking-wider py-2">
                Submit Transfer Request
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAllocationConflict(null)} className="cursor-pointer text-[10px] uppercase tracking-wider py-2 font-bold text-sahara-clay hover:text-sahara-coffee">
                Dismiss Conflict
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Allocation form */}
      {showAllocForm && !allocationConflict && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          className="overflow-hidden"
        >
          <Card className="border-sahara-sand/35 bg-sahara-light/20 shadow-md">
            <CardHeader>
              <CardTitle className="text-[10px]">Asset Distribution Record Sheet</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateAllocation} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-sahara-clay/90 uppercase tracking-widest pl-0.5">Select Asset *</label>
                  <select
                    className="w-full px-4 py-2.5 text-sm bg-white/60 border border-sahara-sand/35 rounded-xl outline-none focus:border-sahara-gold focus:ring-4 focus:ring-sahara-gold/10 text-sahara-coffee font-semibold cursor-pointer transition-all"
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
                  <label className="text-[10px] font-bold text-sahara-clay/90 uppercase tracking-widest pl-0.5">Allocation Target *</label>
                  <div className="flex border border-sahara-sand/25 rounded-xl p-0.5 bg-white/40">
                    <button
                      type="button"
                      onClick={() => { setHolderType('Employee'); setHolderId(''); }}
                      className={`flex-1 py-1.5 text-xs font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer ${holderType === 'Employee' ? 'bg-[#7F5539] text-white shadow-md' : 'text-sahara-clay/70 hover:text-sahara-coffee'}`}
                    >
                      Employee
                    </button>
                    <button
                      type="button"
                      onClick={() => { setHolderType('Department'); setHolderId(''); }}
                      className={`flex-1 py-1.5 text-xs font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer ${holderType === 'Department' ? 'bg-[#7F5539] text-white shadow-md' : 'text-sahara-clay/70 hover:text-sahara-coffee'}`}
                    >
                      Dept
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-sahara-clay/90 uppercase tracking-widest pl-0.5">Assignee ID *</label>
                  <select
                    className="w-full px-4 py-2.5 text-sm bg-white/60 border border-sahara-sand/35 rounded-xl outline-none focus:border-sahara-gold focus:ring-4 focus:ring-sahara-gold/10 text-sahara-coffee font-semibold cursor-pointer transition-all"
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
                  className="bg-white/60"
                  onChange={(e) => setExpectedReturn(e.target.value)}
                />

                <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-2 border-t border-sahara-sand/15 pt-5 mt-2">
                  <Button type="submit" className="px-6 rounded-xl text-xs uppercase tracking-wider font-extrabold cursor-pointer">Finalize Assignment</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Grid split: Active Allocations (Left), Transfer Queue (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Possession List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <span className="text-[10px] font-black text-sahara-clay/60 uppercase tracking-widest pl-0.5">Active Custody Allocations ({allocations.length})</span>
          
          <div className="bg-white/75 backdrop-blur-md border border-sahara-sand/15 rounded-2xl shadow-lg overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-sahara-sand/10 min-w-[550px]">
              <thead className="bg-sahara-light/30 font-bold text-sahara-clay uppercase tracking-widest text-[9px] border-b border-sahara-sand/15">
                <tr>
                  <th className="px-6 py-4.5">Asset</th>
                  <th className="px-6 py-4.5">Assigned To</th>
                  <th className="px-6 py-4.5">Expected Return</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sahara-sand/10 text-sahara-coffee font-semibold">
                {allocations.map((alc, idx) => {
                  const assetObj = assets.find(a => a.id === alc.assetId);
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      key={alc.id} 
                      className="luxury-table-row hover:bg-sahara-sand/5"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-sahara-coffee">{assetObj ? assetObj.name : 'Unknown Asset'}</span>
                          <span className="text-sahara-gold font-mono text-[10px] font-black mt-0.5">{assetObj?.assetTag}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sahara-coffee font-extrabold">{getHolderLabel(alc)}</td>
                      <td className="px-6 py-4 font-mono text-sahara-clay/80">
                        {alc.expectedReturnDate ? new Date(alc.expectedReturnDate).toLocaleDateString() : 'Permanent / Unset'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={alc.status === 'Overdue' ? 'status-lost' : 'status-allocated'}>
                          {alc.status === 'Overdue' ? 'Overdue Return' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="!px-3 !py-1.5 text-[10px] uppercase font-black tracking-wider text-sahara-danger hover:bg-sahara-danger/10 rounded-lg cursor-pointer transition-all"
                          onClick={() => {
                            if (assetObj) {
                              setSelectedAssetForReturn(assetObj);
                            }
                          }}
                        >
                          Check In
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transfers Approval Queue */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <span className="text-[10px] font-black text-sahara-clay/60 uppercase tracking-widest pl-0.5">Transfers Approvals Pool</span>

          <div className="space-y-4">
            {transfers.filter(t => t.status === 'Pending').length === 0 ? (
              <Card className="bg-white/50 border-dashed border-sahara-sand/30 shadow-xs">
                <CardContent className="p-8 text-center text-xs text-sahara-clay/60">
                  No pending asset transfer requests.
                </CardContent>
              </Card>
            ) : (
              transfers.filter(t => t.status === 'Pending').map((tr, index) => {
                const fromUser = employees.find(e => e.id === tr.fromEmployeeId)?.name || 'Previous Owner';
                const toUser = employees.find(e => e.id === tr.toEmployeeId)?.name || 'Recipient';
                return (
                  <motion.div
                    key={tr.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="silk-card bg-white/80 shadow-md">
                      <CardHeader className="p-4 border-b border-sahara-sand/10">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase tracking-widest font-black text-sahara-gold">Ownership Transfer</span>
                          <Badge variant="warning">Approval Pending</Badge>
                        </div>
                        <CardTitle className="text-xs mt-1 font-extrabold text-[#4E342E]">{getAssetName(tr.assetId)}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 flex flex-col gap-3.5 text-xs leading-relaxed">
                        <div className="flex items-center justify-between font-bold text-sahara-coffee">
                          <div className="flex flex-col">
                            <span className="text-sahara-clay/55 text-[9px] uppercase tracking-widest font-bold">From</span>
                            <span className="mt-0.5">{fromUser}</span>
                          </div>
                          <ArrowRightLeft className="h-4 w-4 text-sahara-gold/80" />
                          <div className="flex flex-col items-end">
                            <span className="text-sahara-clay/55 text-[9px] uppercase tracking-widest font-bold">Recipient</span>
                            <span className="mt-0.5">{toUser}</span>
                          </div>
                        </div>
                        <div className="bg-sahara-light/40 border border-sahara-sand/20 p-2.5 rounded-xl text-[11px] text-sahara-clay/80 font-medium italic">
                          "{tr.reason}"
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-t border-sahara-sand/10 pt-3.5 mt-1">
                          <Button size="sm" variant="primary" onClick={() => handleApproveTransfer(tr.id)} className="cursor-pointer text-[10px] uppercase tracking-wider font-extrabold">
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectTransfer(tr.id)} className="cursor-pointer text-[10px] uppercase tracking-wider font-extrabold text-sahara-clay hover:text-sahara-coffee">
                            Deny
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Return Asset Check-In Drawer Modal: Redesigned in Glassmorphism */}
      <AnimatePresence>
        {selectedAssetForReturn && (
          <div className="fixed inset-0 bg-sahara-coffee/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white/95 backdrop-blur-lg border border-sahara-sand/35 rounded-2xl p-7 shadow-2xl w-full max-w-md flex flex-col gap-4.5 text-left relative"
            >
              <div className="flex items-center justify-between border-b border-sahara-sand/15 pb-3">
                <h3 className="font-black text-sm uppercase tracking-wider text-sahara-coffee">Verify Asset Check-In</h3>
                <Badge variant="status-available">{selectedAssetForReturn.assetTag}</Badge>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-sahara-clay/60 uppercase font-black tracking-widest">Asset Being Checked-In:</span>
                <strong className="text-[#4E342E] text-sm font-extrabold">{selectedAssetForReturn.name}</strong>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-sahara-clay/90 uppercase tracking-widest">Returned Condition Status *</label>
                <select
                  className="w-full px-4 py-2.5 text-xs bg-white/60 border border-sahara-sand/35 rounded-xl outline-none focus:border-sahara-gold focus:ring-4 focus:ring-sahara-gold/10 text-sahara-coffee font-semibold cursor-pointer transition-all"
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
                <label className="text-[10px] font-bold text-sahara-clay/90 uppercase tracking-widest">Check-In Notes & Logs *</label>
                <textarea
                  placeholder="Describe actual condition checks, missing accessories, cords, casing damage..."
                  className="w-full min-h-20 px-4 py-2.5 text-xs bg-white/60 border border-sahara-sand/35 rounded-xl outline-none focus:border-sahara-gold focus:ring-4 focus:ring-sahara-gold/10 text-sahara-coffee font-semibold placeholder:text-sahara-clay/35 transition-all"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5 border-t border-sahara-sand/15 pt-4.5 mt-1">
                <Button size="sm" variant="primary" onClick={handleCheckInAsset} className="cursor-pointer font-black text-xs uppercase tracking-wider py-2.5 rounded-xl">
                  Confirm Check-In
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedAssetForReturn(null)} className="cursor-pointer text-xs uppercase tracking-wider font-bold py-2.5 rounded-xl text-sahara-clay hover:text-sahara-coffee">
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default AssetAllocationPage;
