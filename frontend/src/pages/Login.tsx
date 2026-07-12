import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mail, Lock, User, ArrowRight, KeyRound, Building2, CheckCircle, ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { MockDatabase } from '../services/mockDb';
import { Department, UserRole } from '../types';
import { OtpService } from '../services/otp.service';
import { APP } from '../constants/app';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const [isSignup, setIsSignup] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [departments, setDepartments] = React.useState<Department[]>([]);

  // Form Fields - Login
  const [loginEmailOrUser, setLoginEmailOrUser] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');

  // Admin 2FA Step Management
  // 'initial': input email/user. If it is an admin email, transition to 'otp'. If normal, show standard password field immediately.
  const [loginStep, setLoginStep] = React.useState<'initial' | 'otp' | 'credentials'>('initial');
  const [adminEmail, setAdminEmail] = React.useState('');
  const [enteredOtp, setEnteredOtp] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);

  // Form Fields - Signup
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [signupEmail, setSignupEmail] = React.useState('');
  const [signupUsername, setSignupUsername] = React.useState('');
  const [signupPassword, setSignupPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [signupDepartmentId, setSignupDepartmentId] = React.useState('');
  const [signupRequestedRole, setSignupRequestedRole] = React.useState<UserRole>('Employee');

  React.useEffect(() => {
    setDepartments(MockDatabase.getDepartments());
  }, []);

  const handleNextOrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailOrUser.trim()) {
      toast.error('Please enter your email or username.');
      return;
    }

    setIsLoading(true);
    try {
      if (loginStep === 'initial') {
        const emailLower = loginEmailOrUser.toLowerCase();
        const employees = MockDatabase.getEmployees();
        const found = employees.find(
          e => e.email.toLowerCase() === emailLower || 
               (e.username && e.username.toLowerCase() === emailLower)
        );

        if (found && found.role === 'Admin') {
          // Trigger Admin 2FA
          setAdminEmail(found.email);
          setLoginStep('otp');
          toast.success('Admin account detected. Multi-Factor OTP verification required.');
          await handleSendOTP(found.email);
        } else {
          // Normal flow: proceed directly to verify credentials
          setLoginStep('credentials');
        }
      } else if (loginStep === 'credentials') {
        if (!loginPassword) {
          toast.error('Password is required.');
          setIsLoading(false);
          return;
        }
        const user = await login(loginEmailOrUser, loginPassword);
        toast.success(`Welcome back, ${user.name}`);
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication step failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async (email: string) => {
    try {
      await OtpService.sendOTP(email);
      setOtpSent(true);
    } catch (err: any) {
      toast.error('Failed to dispatch 2FA OTP code.');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOtp) {
      toast.error('Please enter your 2FA OTP verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const isVerified = await OtpService.verifyOTP(adminEmail, enteredOtp);
      if (isVerified) {
        toast.success('2FA verification successful. Please verify master password.');
        setLoginStep('credentials');
      } else {
        toast.error('Invalid 2FA Verification code. Please try again.');
      }
    } catch (err: any) {
      toast.error('Error verifying code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !signupEmail.trim() || !signupUsername.trim() || !signupPassword) {
      toast.error('Please fill in all registration fields.');
      return;
    }

    if (signupPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (!signupDepartmentId) {
      toast.error('Please select your corporate department assignment.');
      return;
    }

    setIsLoading(true);
    try {
      const newUser = await signup({
        firstName,
        lastName,
        email: signupEmail,
        username: signupUsername,
        password: signupPassword,
        departmentId: signupDepartmentId,
        requestedRole: signupRequestedRole
      });
      toast.success(`Registration submitted! Welcome to ${APP.NAME}.`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Signup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail: string) => {
    setIsLoading(true);
    try {
      if (roleEmail === 'admin@aureonerp.com') {
        // Enforce OTP flow for admin to demonstrate correctness
        setLoginEmailOrUser(roleEmail);
        setAdminEmail(roleEmail);
        setLoginStep('otp');
        toast.success('Admin Fast-Pass: Enforcing multi-step 2FA simulation.');
        await handleSendOTP(roleEmail);
      } else {
        const user = await login(roleEmail, 'password');
        toast.success(`Signed in as ${user.name} (${user.role})`);
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Fast-pass authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetLoginStates = () => {
    setLoginStep('initial');
    setLoginEmailOrUser('');
    setLoginPassword('');
    setEnteredOtp('');
    setOtpSent(false);
  };

  return (
    <div className="min-h-screen w-screen overflow-hidden flex flex-col items-center justify-center p-4 relative bg-[#FFF8F0]">
      
      {/* Decorative Silk Blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[400px] bg-gradient-to-tr from-[#D4A373]/20 via-[#FAF3E0]/30 to-[#E9D8A6]/20 blur-[80px] rounded-full opacity-60 animate-[silkFloat_20s_ease-in-out_infinite_alternate]" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[600px] h-[450px] bg-gradient-to-br from-[#B5654A]/10 via-[#FAF3E0]/20 to-[#C98C3A]/15 blur-[90px] rounded-full opacity-50 animate-[silkFloat_25s_ease-in-out_infinite_alternate_reverse]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="w-full max-w-lg bg-white/75 backdrop-blur-2xl border border-[#D4A373]/30 rounded-[28px] shadow-[0_25px_60px_-15px_rgba(78,52,46,0.12)] p-8 md:p-10 flex flex-col gap-6 relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <motion.div 
            whileHover={{ rotate: 45, scale: 1.1 }}
            className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#D4A373] to-[#C98C3A] flex items-center justify-center text-white shadow-xl shadow-[#C98C3A]/20"
          >
            <div className="w-5 h-5 bg-white rounded-md rotate-45" />
          </motion.div>
          <div className="flex flex-col gap-1 mt-1">
            <h1 className="text-2xl font-black tracking-tight text-[#4E342E] font-sans">
              {isSignup ? 'Create Account' : `Sign in to ${APP.NAME}`}
            </h1>
            <p className="text-xs text-[#7F5539]/80 font-semibold max-w-xs leading-relaxed">
              {isSignup 
                ? 'Join the luxury physical assets & resource planning system.' 
                : 'Enterprise-grade physical asset lifecycles & custody engines.'
              }
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isSignup ? (
            <motion.div
              key="login-form-container"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-col gap-5"
            >
              {/* ADMIN OTP STEP */}
              {loginStep === 'otp' ? (
                <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
                  <div className="bg-amber-500/5 border border-amber-500/15 p-4 rounded-xl flex items-start gap-3 text-xs text-[#4E342E] font-medium leading-relaxed">
                    <ShieldCheck className="h-5 w-5 text-[#C98C3A] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Enterprise 2FA Protection Enabled</strong>
                      <p className="text-[#7F5539] mt-0.5">
                        A secure login verification code has been dispatched to <strong className="font-semibold text-[#4E342E]">{adminEmail}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <KeyRound className="absolute left-4 top-[38px] h-4 w-4 text-[#7F5539]/55 z-10" />
                    <Input
                      label="6-Digit Verification Code"
                      placeholder="Enter verification code..."
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      className="pl-11 bg-white/50 border-[#D4A373]/25 font-mono text-center tracking-[0.5em] font-extrabold"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      isLoading={isLoading} 
                      className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all"
                    >
                      <span className="tracking-wider text-xs uppercase font-black">Verify Code</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline"
                      type="button"
                      onClick={() => handleSendOTP(adminEmail)}
                      className="py-3 rounded-xl font-bold text-xs uppercase tracking-wider"
                    >
                      Resend
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={resetLoginStates}
                    className="flex items-center justify-center gap-1.5 text-xs text-sahara-clay hover:text-sahara-coffee font-semibold mt-1"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back to email entry
                  </button>
                </form>
              ) : (
                /* INITIAL EMAIL & FINAL CREDENTIALS STEPS */
                <form onSubmit={handleNextOrSubmit} className="flex flex-col gap-4.5">
                  <div className="relative">
                    <Mail className="absolute left-4 top-[38px] h-4 w-4 text-[#7F5539]/55 z-10" />
                    <Input
                      label="Work Email Address or Username"
                      placeholder="sarah@cyberdyne.com or sconnor"
                      className="pl-11 bg-white/50 border-[#D4A373]/25"
                      value={loginEmailOrUser}
                      onChange={(e) => setLoginEmailOrUser(e.target.value)}
                      disabled={loginStep === 'credentials'}
                      required
                    />
                  </div>

                  {loginStep === 'credentials' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between mb-0.5 pl-0.5">
                        <label className="text-[10px] font-bold text-[#7F5539]/90 uppercase tracking-widest">
                          Master Password
                        </label>
                        <Link 
                          to="/forgot-password" 
                          className="text-[10px] font-bold text-[#C98C3A] hover:text-[#B5654A] transition-colors tracking-widest uppercase"
                        >
                          Forgot?
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 h-4 w-4 text-[#7F5539]/55 z-10" />
                        <input
                          type="password"
                          className="w-full pl-11 pr-4 py-2.5 text-sm bg-white/50 backdrop-blur-xs border border-[#D4A373]/25 rounded-xl outline-none focus:border-[#C98C3A] focus:ring-4 focus:ring-[#C98C3A]/10 transition-all placeholder:text-[#7F5539]/30 text-[#4E342E] font-medium"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  <Button 
                    type="submit" 
                    isLoading={isLoading} 
                    className="w-full mt-2 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all"
                  >
                    <span className="tracking-wider text-xs uppercase font-black">
                      {loginStep === 'credentials' ? 'Authenticate Session' : 'Access System'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  {loginStep === 'credentials' && (
                    <button
                      type="button"
                      onClick={resetLoginStates}
                      className="flex items-center justify-center gap-1.5 text-xs text-sahara-clay hover:text-sahara-coffee font-semibold"
                    >
                      <ChevronLeft className="h-4 w-4" /> Use different account
                    </button>
                  )}
                </form>
              )}
            </motion.div>
          ) : (
            /* DYNAMIC SIGNUP FORM */
            <motion.form
              key="signup-form-container"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleSignupSubmit}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-white/50 border-[#D4A373]/25"
                  required
                />
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-white/50 border-[#D4A373]/25"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-[38px] h-3.5 w-3.5 text-[#7F5539]/50 z-10" />
                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="john@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="pl-10 bg-white/50 border-[#D4A373]/25"
                    required
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3.5 top-[38px] h-3.5 w-3.5 text-[#7F5539]/50 z-10" />
                  <Input
                    label="Username"
                    placeholder="johndoe"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    className="pl-10 bg-white/50 border-[#D4A373]/25"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Lock className="absolute left-3.5 top-[38px] h-3.5 w-3.5 text-[#7F5539]/50 z-10" />
                  <Input
                    type="password"
                    label="Password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="pl-10 bg-white/50 border-[#D4A373]/25"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-[38px] h-3.5 w-3.5 text-[#7F5539]/50 z-10" />
                  <Input
                    type="password"
                    label="Confirm Password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-white/50 border-[#D4A373]/25"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Department dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#7F5539]/90 uppercase tracking-widest pl-0.5">
                    Department Assign
                  </label>
                  <select
                    className="w-full px-3 py-2.5 text-xs bg-white/50 border border-[#D4A373]/25 rounded-xl outline-none focus:border-[#C98C3A] text-[#4E342E] font-semibold cursor-pointer transition-all"
                    value={signupDepartmentId}
                    onChange={(e) => setSignupDepartmentId(e.target.value)}
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

                {/* Requested Role dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#7F5539]/90 uppercase tracking-widest pl-0.5">
                    Requested Access Role
                  </label>
                  <select
                    className="w-full px-3 py-2.5 text-xs bg-white/50 border border-[#D4A373]/25 rounded-xl outline-none focus:border-[#C98C3A] text-[#4E342E] font-semibold cursor-pointer transition-all"
                    value={signupRequestedRole}
                    onChange={(e) => setSignupRequestedRole(e.target.value as UserRole)}
                    required
                  >
                    <option value="Employee">Employee (Read/Book Assets)</option>
                    <option value="Department Head">Department Head</option>
                    <option value="Asset Manager">Asset Manager (Allocations)</option>
                  </select>
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-[10px] text-sahara-clay font-medium leading-relaxed">
                * Note: Your account will be registered under the Employee role initially. Once an administrator approves your dossier, the requested access privileges will be activated.
              </div>

              <Button 
                type="submit" 
                isLoading={isLoading} 
                className="w-full mt-2 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all"
              >
                <span className="tracking-wider text-xs uppercase font-black">Submit Registration Request</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Form Toggle */}
        <div className="text-center text-xs text-[#7F5539] font-medium">
          {isSignup ? (
            <span>
              Already have an enterprise account?{' '}
              <button 
                onClick={() => {
                  setIsSignup(false);
                  resetLoginStates();
                }} 
                className="text-[#C98C3A] font-extrabold hover:text-[#B5654A] cursor-pointer hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need access credentials?{' '}
              <button 
                onClick={() => setIsSignup(true)} 
                className="text-[#C98C3A] font-extrabold hover:text-[#B5654A] cursor-pointer hover:underline"
              >
                Request Credentials
              </button>
            </span>
          )}
        </div>

        {/* Fast-Pass Credentials Section */}
        <div className="border-t border-[#D4A373]/25 pt-5 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#7F5539]/80 pl-0.5">
            <ShieldCheck className="h-4 w-4 text-[#C98C3A]" />
            <span>Developer Fast-Pass Credentials</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('admin@aureonerp.com')}
              className="px-1.5 py-2 text-[9px] font-black uppercase tracking-wider border border-[#D4A373]/25 hover:border-[#C98C3A] rounded-xl bg-white/40 text-[#4E342E] hover:bg-[#C98C3A]/10 transition-all duration-300 cursor-pointer truncate shadow-xs font-sans"
              title="admin@aureonerp.com (2FA flow)"
            >
              Admin (2FA)
            </button>
            <button
              onClick={() => handleQuickLogin('manager@aureonerp.com')}
              className="px-1.5 py-2 text-[9px] font-black uppercase tracking-wider border border-[#D4A373]/25 hover:border-[#C98C3A] rounded-xl bg-white/40 text-[#4E342E] hover:bg-[#C98C3A]/10 transition-all duration-300 cursor-pointer truncate shadow-xs font-sans"
              title="manager@aureonerp.com"
            >
              Asset Manager
            </button>
            <button
              onClick={() => handleQuickLogin('employee@aureonerp.com')}
              className="px-1.5 py-2 text-[9px] font-black uppercase tracking-wider border border-[#D4A373]/25 hover:border-[#C98C3A] rounded-xl bg-white/40 text-[#4E342E] hover:bg-[#C98C3A]/10 transition-all duration-300 cursor-pointer truncate shadow-xs font-sans"
              title="employee@aureonerp.com"
            >
              Staff Employee
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default Login;
