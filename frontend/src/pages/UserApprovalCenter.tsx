import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, CheckCircle2, XCircle, Search, Eye, ThumbsUp, ThumbsDown, Info, Building2, UserCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { authService } from '../services/auth.service';
import { MockDatabase } from '../services/mockDb';
import { Employee, Department, UserRole } from '../types';
import toast from 'react-hot-toast';

export const UserApprovalCenter: React.FC = () => {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<'All' | 'Pending Approval' | 'Rejected' | 'Active'>('Pending Approval');
  const [isLoading, setIsLoading] = React.useState(true);

  // Selected User for Detail View
  const [selectedUser, setSelectedUser] = React.useState<Employee | null>(null);

  // Approval Modal States
  const [approvingUser, setApprovingUser] = React.useState<Employee | null>(null);
  const [finalDepartment, setFinalDepartment] = React.useState('');
  const [finalRole, setFinalRole] = React.useState<UserRole>('Employee');

  // Rejection Modal States
  const [rejectingUser, setRejectingUser] = React.useState<Employee | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');

  const fetchUsers = () => {
    setIsLoading(true);
    try {
      const allEmps = MockDatabase.getEmployees();
      const allDepts = MockDatabase.getDepartments();
      setEmployees(allEmps);
      setDepartments(allDepts);
    } catch (e) {
      toast.error('Failed to pull user credentials registry.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenApprove = (user: Employee) => {
    setApprovingUser(user);
    setFinalDepartment(user.departmentId || '');
    setFinalRole(user.requestedRole || 'Employee');
  };

  const handleConfirmApprove = async () => {
    if (!approvingUser) return;
    if (!finalDepartment) {
      toast.error('Please assign a corporate department.');
      return;
    }

    try {
      // BACKEND API CONNECTION POINT
      // PUT /api/users/{id}/approve
      // Request DTO: { departmentId: string, finalRole: UserRole }
      await authService.approveUser(approvingUser.id, finalDepartment, finalRole);
      
      toast.success(`${approvingUser.name} has been activated successfully.`);
      setApprovingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Approval failed.');
    }
  };

  const handleOpenReject = (user: Employee) => {
    setRejectingUser(user);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingUser) return;
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }

    try {
      // BACKEND API CONNECTION POINT
      // PUT /api/users/{id}/reject
      // Request DTO: { reason: string }
      await authService.rejectUser(rejectingUser.id, rejectionReason);
      
      toast.success(`${rejectingUser.name}'s registration has been rejected.`);
      setRejectingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Rejection failed.');
    }
  };

  // Filter and Search logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.username && emp.username.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterStatus === 'All') return matchesSearch;
    return emp.status === filterStatus && matchesSearch;
  });

  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return 'N/A';
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'Unknown';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-sahara-coffee">User Approval Center</h1>
        <p className="text-xs text-sahara-clay/70 font-semibold leading-relaxed">
          Manage system registration credentials, regulate user statuses, and verify access authorizations.
        </p>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white/80 border-l-4 border-l-sahara-gold shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-sahara-clay uppercase tracking-wider">Pending Action</span>
              <span className="text-2xl font-black text-sahara-coffee">
                {employees.filter(e => e.status === 'Pending Approval').length}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-[#C98C3A]">
              <Search className="h-5 w-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-sahara-clay uppercase tracking-wider">Approved Staff</span>
              <span className="text-2xl font-black text-sahara-coffee">
                {employees.filter(e => e.status === 'Active' && e.role !== 'Admin').length}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-700">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-l-4 border-l-sahara-danger shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-sahara-clay uppercase tracking-wider">Rejected Requests</span>
              <span className="text-2xl font-black text-sahara-coffee">
                {employees.filter(e => e.status === 'Rejected').length}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sahara-danger/10 flex items-center justify-center text-sahara-danger">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 p-4 rounded-2xl border border-sahara-sand/15">
        <div className="flex flex-wrap gap-2">
          {(['Pending Approval', 'Rejected', 'Active', 'All'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all border
                ${filterStatus === status 
                  ? 'bg-sahara-coffee text-white border-sahara-coffee' 
                  : 'bg-white border-sahara-sand/15 text-sahara-clay hover:bg-sahara-sand/5'
                }
              `}
            >
              {status === 'Pending Approval' ? 'Pending Action' : status === 'Active' ? 'Activated' : status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-sahara-clay/50" />
          <input
            type="text"
            placeholder="Search request registry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-sahara-sand/25 rounded-xl outline-none focus:border-sahara-gold transition-all"
          />
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="bg-white/80 backdrop-blur-md border border-sahara-sand/15 rounded-2xl shadow-lg overflow-hidden overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-20 text-[10px] font-black text-sahara-gold uppercase tracking-widest">
            Loading Registration Requests...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-20 text-xs text-sahara-clay/60 font-semibold leading-relaxed">
            No matching registration applications found for this filter.
          </div>
        ) : (
          <table className="w-full text-left text-xs divide-y divide-sahara-sand/10 min-w-[750px]">
            <thead className="bg-sahara-light/30 font-bold text-sahara-clay uppercase tracking-widest text-[9px] border-b border-sahara-sand/15">
              <tr>
                <th className="px-6 py-4.5">User</th>
                <th className="px-6 py-4.5">Email</th>
                <th className="px-6 py-4.5">Department</th>
                <th className="px-6 py-4.5">Requested Role</th>
                <th className="px-6 py-4.5">Registration Date</th>
                <th className="px-6 py-4.5">Status</th>
                <th className="px-6 py-4.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sahara-sand/10 text-sahara-coffee font-semibold">
              {filteredEmployees.map((emp, idx) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="luxury-table-row hover:bg-sahara-sand/5"
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img 
                      src={emp.avatarUrl} 
                      className="h-8.5 w-8.5 rounded-xl object-cover border border-sahara-sand/15" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold truncate">{emp.name}</span>
                      <span className="text-[10px] font-mono font-bold text-sahara-gold truncate">@{emp.username || emp.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-sahara-clay">
                    {emp.email}
                  </td>
                  <td className="px-6 py-4 text-sahara-clay font-bold">
                    {getDepartmentName(emp.departmentId)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="muted" className="font-extrabold uppercase text-[9px]">
                      {emp.requestedRole || 'Employee'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sahara-clay/70 font-mono text-[10px]">
                    {emp.registrationDate ? new Date(emp.registrationDate).toLocaleDateString() : 'Just now'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 font-black uppercase text-[9px] tracking-wider
                      ${emp.status === 'Pending Approval' ? 'text-[#C98C3A]' : 
                        emp.status === 'Rejected' ? 'text-sahara-danger' : 'text-emerald-700'}
                    `}>
                      <span className={`h-1.5 w-1.5 rounded-full
                        ${emp.status === 'Pending Approval' ? 'bg-[#C98C3A]' : 
                          emp.status === 'Rejected' ? 'bg-sahara-danger' : 'bg-emerald-500'}
                      `} />
                      {emp.status === 'Pending Approval' ? 'Pending' : emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedUser(emp)}
                        className="cursor-pointer p-1.5 text-sahara-clay hover:text-sahara-coffee"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {emp.status === 'Pending Approval' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenApprove(emp)}
                            className="cursor-pointer p-1.5 text-emerald-700 hover:text-emerald-800"
                            title="Approve Request"
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenReject(emp)}
                            className="cursor-pointer p-1.5 text-sahara-danger hover:text-red-700"
                            title="Reject Request"
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals & AnimatePresence drawers */}
      <AnimatePresence>
        {/* Approve Dialog */}
        {approvingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sahara-coffee/40 backdrop-blur-md"
              onClick={() => setApprovingUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-sahara-sand/30 shadow-2xl p-6 flex flex-col gap-5 z-10"
            >
              <div className="flex items-start gap-3 border-b border-sahara-sand/10 pb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-black text-sahara-coffee">Approve Registration</h3>
                  <span className="text-xs text-sahara-clay/70">Activate user credentials and provision permissions.</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-sahara-light/40 p-3 rounded-xl border border-sahara-sand/20 text-xs">
                <img src={approvingUser.avatarUrl} className="h-10 w-10 rounded-xl object-cover" />
                <div className="flex flex-col min-w-0">
                  <strong className="text-sahara-coffee truncate font-black">{approvingUser.name}</strong>
                  <span className="text-sahara-clay/70 truncate font-semibold">{approvingUser.email}</span>
                  <span className="text-[10px] text-sahara-gold uppercase tracking-wider font-extrabold mt-0.5">Requested Role: {approvingUser.requestedRole || 'Employee'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {/* Assign Department */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-sahara-clay uppercase tracking-widest pl-0.5">
                    Assign Final Department
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-sahara-sand/25 rounded-xl outline-none focus:border-sahara-gold text-sahara-coffee font-semibold cursor-pointer transition-all"
                    value={finalDepartment}
                    onChange={(e) => setFinalDepartment(e.target.value)}
                  >
                    <option value="">Select Department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Override Role selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-sahara-clay uppercase tracking-widest pl-0.5">
                    Assign Final Authorization Role
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-sahara-sand/25 rounded-xl outline-none focus:border-sahara-gold text-sahara-coffee font-semibold cursor-pointer transition-all"
                    value={finalRole}
                    onChange={(e) => setFinalRole(e.target.value as UserRole)}
                  >
                    <option value="Employee">Employee (Read/Book Only)</option>
                    <option value="Department Head">Department Head</option>
                    <option value="Asset Manager">Asset Manager (Allocations/Repairs)</option>
                  </select>
                  <p className="text-[10px] text-[#C98C3A] font-medium leading-normal pl-0.5 mt-0.5">
                    Admin may override requested roles according to corporate hierarchy policies.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-sahara-sand/10">
                <Button
                  onClick={handleConfirmApprove}
                  className="flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer shadow-lg hover:shadow-xl bg-emerald-700 hover:bg-emerald-800"
                >
                  Activate Account
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setApprovingUser(null)}
                  className="py-3 rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer border-sahara-sand/30 hover:bg-sahara-sand/5 text-sahara-clay"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Reject Dialog */}
        {rejectingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sahara-coffee/40 backdrop-blur-md"
              onClick={() => setRejectingUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-sahara-danger/25 shadow-2xl p-6 flex flex-col gap-5 z-10"
            >
              <div className="flex items-start gap-3 border-b border-sahara-sand/10 pb-4">
                <div className="h-10 w-10 rounded-xl bg-sahara-danger/10 text-sahara-danger flex items-center justify-center">
                  <XCircle className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-black text-sahara-coffee">Reject Registration</h3>
                  <span className="text-xs text-sahara-clay/70">Specify reasons for denying access credentials.</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-sahara-danger/5 p-3 rounded-xl border border-sahara-danger/10 text-xs">
                <img src={rejectingUser.avatarUrl} className="h-10 w-10 rounded-xl object-cover" />
                <div className="flex flex-col min-w-0">
                  <strong className="text-sahara-coffee truncate font-black">{rejectingUser.name}</strong>
                  <span className="text-sahara-clay/70 truncate font-semibold">{rejectingUser.email}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-sahara-danger uppercase tracking-widest pl-0.5">
                  Reason for Rejection *
                </label>
                <textarea
                  required
                  placeholder="Provide detailed feedback. e.g. Department Head position is already allocated. Please resubmit requesting Employee role."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-sahara-danger/20 rounded-xl outline-none focus:ring-4 focus:ring-sahara-danger/10 text-sahara-coffee font-semibold cursor-pointer transition-all min-h-[90px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-sahara-sand/10">
                <Button
                  onClick={handleConfirmReject}
                  className="flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer shadow-lg hover:shadow-xl bg-sahara-danger hover:bg-red-700"
                >
                  Save Rejection
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRejectingUser(null)}
                  className="py-3 rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer border-sahara-sand/30 hover:bg-sahara-sand/5 text-sahara-clay"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* View Details Dialog */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sahara-coffee/40 backdrop-blur-md"
              onClick={() => setSelectedUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-sahara-sand/30 shadow-2xl p-6 flex flex-col gap-5 z-10"
            >
              <div className="flex items-start gap-3 border-b border-sahara-sand/10 pb-4">
                <div className="h-10 w-10 rounded-xl bg-sahara-light/60 text-sahara-coffee flex items-center justify-center">
                  <Info className="h-5 w-5 text-sahara-gold" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-black text-sahara-coffee">Application Dossier</h3>
                  <span className="text-xs text-sahara-clay/70">Examine details of the submitted registration.</span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-sahara-light/40 p-4 rounded-2xl border border-sahara-sand/20">
                <img src={selectedUser.avatarUrl} className="h-14 w-14 rounded-2xl object-cover border border-sahara-sand/25" />
                <div className="flex flex-col min-w-0">
                  <h4 className="text-sm font-black text-sahara-coffee truncate">{selectedUser.name}</h4>
                  <span className="text-[11px] font-mono font-bold text-sahara-gold">@{selectedUser.username || 'N/A'}</span>
                  <span className="text-xs text-sahara-clay/80 truncate font-semibold mt-0.5">{selectedUser.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 text-xs font-semibold text-sahara-coffee pt-2">
                <div className="flex flex-col gap-1 bg-sahara-light/25 p-3 rounded-xl border border-sahara-sand/10">
                  <span className="text-[9px] text-sahara-clay uppercase tracking-widest font-black">Department</span>
                  <span className="truncate font-extrabold">{getDepartmentName(selectedUser.departmentId)}</span>
                </div>
                <div className="flex flex-col gap-1 bg-sahara-light/25 p-3 rounded-xl border border-sahara-sand/10">
                  <span className="text-[9px] text-sahara-clay uppercase tracking-widest font-black">Requested Role</span>
                  <span className="truncate font-extrabold text-sahara-gold uppercase tracking-wide text-[10px]">{selectedUser.requestedRole || 'Employee'}</span>
                </div>
                <div className="flex flex-col gap-1 bg-sahara-light/25 p-3 rounded-xl border border-sahara-sand/10">
                  <span className="text-[9px] text-sahara-clay uppercase tracking-widest font-black">Registration Date</span>
                  <span className="truncate text-[11px] font-mono font-bold text-sahara-clay">
                    {selectedUser.registrationDate ? new Date(selectedUser.registrationDate).toLocaleDateString() : 'Just now'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 bg-sahara-light/25 p-3 rounded-xl border border-sahara-sand/10">
                  <span className="text-[9px] text-sahara-clay uppercase tracking-widest font-black">Application Status</span>
                  <span className="truncate font-black text-[10px] uppercase">{selectedUser.status}</span>
                </div>
              </div>

              {selectedUser.status === 'Rejected' && selectedUser.rejectionReason && (
                <div className="bg-sahara-danger/5 border border-sahara-danger/15 rounded-xl p-3 text-xs flex flex-col gap-1">
                  <strong className="text-[9px] text-sahara-danger uppercase tracking-wider font-black">REJECTION FEEDBACK</strong>
                  <p className="text-sahara-coffee italic font-medium">"{selectedUser.rejectionReason}"</p>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-sahara-sand/10">
                {selectedUser.status === 'Pending Approval' && (
                  <>
                    <Button
                      onClick={() => {
                        handleOpenApprove(selectedUser);
                        setSelectedUser(null);
                      }}
                      className="flex-1 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-emerald-700 hover:bg-emerald-800"
                    >
                      Approve...
                    </Button>
                    <Button
                      onClick={() => {
                        handleOpenReject(selectedUser);
                        setSelectedUser(null);
                      }}
                      className="flex-1 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-sahara-danger hover:bg-red-700"
                    >
                      Reject...
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[10px] border-sahara-sand/30 hover:bg-sahara-sand/5 text-sahara-clay"
                >
                  Dismiss Dossier
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default UserApprovalCenter;
