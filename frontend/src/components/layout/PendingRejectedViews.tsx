import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Clock, RefreshCw, LogOut, FileText, User, Mail, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MockDatabase } from '../../services/mockDb';
import { Department, UserRole } from '../../types';
import { APP } from '../../constants/app';
import toast from 'react-hot-toast';

export const WaitingForApprovalView: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUser();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Application status updated.');
    }, 500);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen w-screen overflow-hidden flex flex-col items-center justify-center p-6 relative bg-[#FFF8F0]">
      {/* Visual Background Blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[400px] bg-gradient-to-tr from-[#D4A373]/20 via-[#FAF3E0]/30 to-[#E9D8A6]/20 blur-[80px] rounded-full opacity-60" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[600px] h-[450px] bg-gradient-to-br from-[#B5654A]/10 via-[#FAF3E0]/20 to-[#C98C3A]/15 blur-[90px] rounded-full opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white/80 backdrop-blur-xl border border-[#D4A373]/30 rounded-[28px] shadow-2xl p-8 md:p-10 flex flex-col gap-6 text-center"
      >
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-[#C98C3A] flex items-center justify-center border border-amber-500/20">
            <Clock className="h-7 w-7 animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-[#4E342E]">Waiting For Approval</h1>
          <p className="text-xs text-[#7F5539]/85 font-semibold px-4">
            Your registration is currently under review by our ERP administration team.
          </p>
        </div>

        <div className="bg-white/40 border border-[#D4A373]/20 rounded-2xl p-5 text-left flex flex-col gap-3 font-semibold text-xs text-[#4E342E]">
          <div className="flex items-center justify-between border-b border-sahara-sand/10 pb-2.5">
            <span className="text-[#7F5539]/70 uppercase tracking-wider text-[10px] font-black">Application Status</span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-[#C98C3A] border border-amber-500/20">
              Pending Approval
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-sahara-sand/10 pb-2.5">
            <span className="text-[#7F5539]/70 uppercase tracking-wider text-[10px] font-black">Requested Role</span>
            <span className="font-extrabold uppercase text-[#7F5539]">{user.requestedRole || 'Employee'}</span>
          </div>
          <div className="flex items-center justify-between border-b border-sahara-sand/10 pb-2.5">
            <span className="text-[#7F5539]/70 uppercase tracking-wider text-[10px] font-black">Registration Date</span>
            <span className="font-mono font-bold text-[#7F5539]">
              {user.registrationDate ? new Date(user.registrationDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Just now'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#7F5539]/70 uppercase tracking-wider text-[10px] font-black">Estimated Review Time</span>
            <span className="text-emerald-700 font-extrabold">{user.estimatedReviewTime || '24-48 Hours'}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <Button
            variant="primary"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            className="py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Check Review Status
          </Button>

          <Button
            variant="outline"
            onClick={logout}
            className="py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer border-sahara-danger/20 text-sahara-danger hover:bg-sahara-danger/10"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export const RejectedUserView: React.FC = () => {
  const { user, logout, resubmit } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  
  // Resubmit fields
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [departmentId, setDepartmentId] = React.useState('');
  const [requestedRole, setRequestedRole] = React.useState<UserRole>('Employee');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setDepartments(MockDatabase.getDepartments());
    if (user) {
      const parts = user.name.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setUsername(user.username || '');
      setDepartmentId(user.departmentId || '');
      setRequestedRole(user.requestedRole || 'Employee');
    }
  }, [user]);

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !username.trim() || !departmentId) {
      toast.error('All profile fields are required.');
      return;
    }

    setIsLoading(true);
    try {
      await resubmit({
        firstName,
        lastName,
        email,
        username,
        departmentId,
        requestedRole
      });
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to resubmit application.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen w-screen overflow-hidden flex flex-col items-center justify-center p-6 relative bg-[#FFF8F0]">
      {/* Background Blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[400px] bg-gradient-to-tr from-[#D4A373]/20 via-[#FAF3E0]/30 to-[#E9D8A6]/20 blur-[80px] rounded-full opacity-60" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[600px] h-[450px] bg-gradient-to-br from-[#B5654A]/10 via-[#FAF3E0]/20 to-[#C98C3A]/15 blur-[90px] rounded-full opacity-50" />
      </div>

      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="rejected-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-white/80 backdrop-blur-xl border border-[#D4A373]/30 rounded-[28px] shadow-2xl p-8 md:p-10 flex flex-col gap-6 text-center"
          >
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-2xl bg-sahara-danger/10 text-sahara-danger flex items-center justify-center border border-sahara-danger/20">
                <ShieldAlert className="h-7 w-7" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-black text-sahara-danger">Application Rejected</h1>
              <p className="text-xs text-[#7F5539]/85 font-semibold px-4">
                Unfortunately, your application for {APP.NAME} credentials could not be approved at this time.
              </p>
            </div>

            {/* Rejection Details */}
            <div className="bg-sahara-danger/5 border border-sahara-danger/15 rounded-2xl p-5 text-left flex flex-col gap-3 font-semibold text-xs">
              <strong className="text-[10px] text-sahara-danger uppercase tracking-widest font-black border-b border-sahara-danger/10 pb-2">
                REASON FOR REJECTION
              </strong>
              <p className="text-[#4E342E] italic leading-relaxed font-medium">
                "{user.rejectionReason || 'No specific reason given by administrator. Please verify your department allocation and access level request.'}"
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <Button
                variant="primary"
                onClick={() => setIsEditing(true)}
                className="py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl"
              >
                <FileText className="h-4 w-4" />
                Edit Profile & Resubmit
              </Button>

              <Button
                variant="outline"
                onClick={logout}
                className="py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer border-sahara-danger/20 text-sahara-danger hover:bg-sahara-danger/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="edit-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-white/85 backdrop-blur-xl border border-[#D4A373]/30 rounded-[28px] shadow-2xl p-8 md:p-10 flex flex-col gap-6"
          >
            <div className="text-center flex flex-col gap-1.5">
              <h2 className="text-xl font-black text-[#4E342E]">Resubmit Application</h2>
              <p className="text-xs text-[#7F5539]/70 font-semibold">
                Correct your registration data or adjust requested system roles.
              </p>
            </div>

            <form onSubmit={handleResubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="Sarah"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-white/50"
                  required
                />
                <Input
                  label="Last Name"
                  placeholder="Connor"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-white/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-[38px] h-3.5 w-3.5 text-[#7F5539]/50 z-10" />
                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="sarah@cyberdyne.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/50"
                    required
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3.5 top-[38px] h-3.5 w-3.5 text-[#7F5539]/50 z-10" />
                  <Input
                    label="Username"
                    placeholder="sconnor"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-white/50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Department Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#7F5539]/90 uppercase tracking-widest pl-0.5">
                    Department
                  </label>
                  <select
                    className="w-full px-3 py-2.5 text-xs bg-white/50 border border-[#D4A373]/25 rounded-xl outline-none focus:border-[#C98C3A] text-[#4E342E] font-semibold cursor-pointer transition-all"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    required
                  >
                    <option value="">Select Department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Requested Role Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#7F5539]/90 uppercase tracking-widest pl-0.5">
                    Requested Role
                  </label>
                  <select
                    className="w-full px-3 py-2.5 text-xs bg-white/50 border border-[#D4A373]/25 rounded-xl outline-none focus:border-[#C98C3A] text-[#4E342E] font-semibold cursor-pointer transition-all"
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value as UserRole)}
                    required
                  >
                    <option value="Employee">Employee (Read/Book Only)</option>
                    <option value="Department Head">Department Head</option>
                    <option value="Asset Manager">Asset Manager (Allocations)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Check className="h-4 w-4" />
                  Resubmit Application
                </Button>
                
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-3 rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer border-sahara-sand/30 hover:bg-sahara-sand/5 text-sahara-clay"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
