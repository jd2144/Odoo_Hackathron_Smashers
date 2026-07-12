import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authService } from '../services/auth.service';
import { Employee } from '../types';
import toast from 'react-hot-toast';

// ==============================
// BACKEND INTEGRATION
// Page: Login & Signup
//
// API Endpoints Required:
// 1. POST /api/auth/login
//    - Authentication: None (Public)
//    - Request Body: { email: string, password?: string }
//    - Response: { success: true, data: Employee }
// 
// 2. POST /api/auth/signup
//    - Authentication: None (Public)
//    - Request Body: { name: string, email: string }
//    - Response: { success: true, data: Employee }
//
// Validation rules:
// - Email must be verified and formatted.
// - Password rules as required.
// ==============================

interface LoginProps {
  onLoginSuccess: (user: Employee) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('••••••••');

  // TODO(BACKEND):
  // Handle form submission and forward payloads to authService API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required.');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignup) {
        if (!name) {
          toast.error('Name is required.');
          setIsLoading(false);
          return;
        }
        const newUser = await authService.signup(name, email);
        toast.success(`Welcome to AssetFlow, ${newUser.name}!`);
        onLoginSuccess(newUser);
        navigate('/');
      } else {
        const user = await authService.login(email, password);
        toast.success(`Successfully logged in as ${user.name}`);
        onLoginSuccess(user);
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // TODO(BACKEND):
  // Quick-login logic for demo/hackathon environment
  const handleQuickLogin = async (roleEmail: string) => {
    setIsLoading(true);
    try {
      const user = await authService.login(roleEmail, 'password');
      toast.success(`Signed in as ${user.name} (${user.role})`);
      onLoginSuccess(user);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-brand-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white border border-brand-border rounded-2xl shadow-xl p-8 flex flex-col gap-6"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-md shadow-brand-primary/10">
            <div className="w-5 h-5 bg-white rounded-sm rotate-45"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-brand-text">
            {isSignup ? 'Create an Account' : 'Sign in to AssetFlow'}
          </h1>
          <p className="text-xs text-brand-muted max-w-xs">
            {isSignup 
              ? 'Join the Enterprise Asset & Resource Management ERP.' 
              : 'Enterprise-grade physical asset lifecycle & allocation engine.'
            }
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignup && (
            <div className="relative">
              <User className="absolute left-3.5 top-9 h-4 w-4 text-brand-muted" />
              <Input
                label="Full Name"
                placeholder="Alexander Wright"
                className="pl-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3.5 top-9 h-4 w-4 text-brand-muted" />
            <Input
              type="email"
              label="Work Email Address"
              placeholder="alex@organization.com"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-brand-text/80 uppercase tracking-wider">
                Password
              </label>
              {!isSignup && (
                <Link 
                  to="/forgot-password" 
                  className="text-xs font-semibold text-brand-primary hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-muted" />
              <input
                type="password"
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-brand-border rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all placeholder:text-gray-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            isLoading={isLoading} 
            className="w-full mt-2 font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSignup ? 'Register' : 'Access System'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {/* Form Toggle */}
        <div className="text-center text-xs text-brand-muted">
          {isSignup ? (
            <span>
              Already have an account?{' '}
              <button 
                onClick={() => setIsSignup(false)} 
                className="text-brand-primary font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button 
                onClick={() => setIsSignup(true)} 
                className="text-brand-primary font-bold hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </span>
          )}
        </div>

        {/* Sandbox Access Shortcuts (Hackathon Special) */}
        <div className="border-t border-brand-border pt-5 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-muted">
            <ShieldCheck className="h-4 w-4 text-brand-primary" />
            <span>Developer Fast-Pass Credentials</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('admin@assetflow.com')}
              className="px-2 py-1.5 text-[10px] font-bold border border-brand-border hover:border-brand-primary rounded-lg bg-gray-50 text-brand-text hover:bg-brand-primary/10 transition-all cursor-pointer truncate"
              title="admin@assetflow.com"
            >
              Admin Role
            </button>
            <button
              onClick={() => handleQuickLogin('manager@assetflow.com')}
              className="px-2 py-1.5 text-[10px] font-bold border border-brand-border hover:border-brand-primary rounded-lg bg-gray-50 text-brand-text hover:bg-brand-primary/10 transition-all cursor-pointer truncate"
              title="manager@assetflow.com"
            >
              Manager Role
            </button>
            <button
              onClick={() => handleQuickLogin('employee@assetflow.com')}
              className="px-2 py-1.5 text-[10px] font-bold border border-brand-border hover:border-brand-primary rounded-lg bg-gray-50 text-brand-text hover:bg-brand-primary/10 transition-all cursor-pointer truncate"
              title="employee@assetflow.com"
            >
              Staff Role
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default Login;
