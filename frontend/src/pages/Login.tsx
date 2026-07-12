import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authService } from '../services/auth.service';
import { Employee } from '../types';
import toast from 'react-hot-toast';

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
    <div className="min-h-screen w-screen overflow-hidden flex flex-col items-center justify-center p-4 relative bg-[#FFF8F0]">
      
      {/* Premium Layered Silk Blocks in background */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Silk block 1: Warm Golden Sand */}
        <motion.div 
          animate={{
            x: [0, 50, -20],
            y: [0, -30, 40],
            rotate: [0, 10, -5],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
          className="absolute -top-[10%] -left-[10%] w-[500px] h-[400px] bg-gradient-to-tr from-[#D4A373]/20 via-[#FAF3E0]/30 to-[#E9D8A6]/20 blur-[80px] rounded-full opacity-60"
        />

        {/* Silk block 2: Desert Sunset Sunset Terracotta */}
        <motion.div 
          animate={{
            x: [0, -40, 30],
            y: [0, 40, -30],
            rotate: [0, -8, 12],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
          className="absolute -bottom-[15%] -right-[10%] w-[600px] h-[450px] bg-gradient-to-br from-[#B5654A]/10 via-[#FAF3E0]/20 to-[#C98C3A]/15 blur-[90px] rounded-full opacity-50"
        />

        {/* Silk block 3: Oasis Green Tint */}
        <motion.div 
          animate={{
            x: [0, 30, -30],
            y: [0, 30, -40],
            scale: [1, 1.1, 0.95],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
          className="absolute top-[40%] right-[15%] w-[350px] h-[350px] bg-gradient-to-tr from-[#7A8450]/8 via-[#FAF3E0]/15 to-[#D4A373]/10 blur-[75px] rounded-full opacity-40"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="w-full max-w-md bg-white/75 backdrop-blur-2xl border border-[#D4A373]/30 rounded-[24px] shadow-[0_25px_60px_-15px_rgba(78,52,46,0.12)] p-8 md:p-10 flex flex-col gap-8 relative z-10"
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
              {isSignup ? 'Create Account' : 'Sign in to AssetFlow'}
            </h1>
            <p className="text-xs text-[#7F5539]/80 font-semibold max-w-xs leading-relaxed">
              {isSignup 
                ? 'Join the luxury physical assets & resource planning system.' 
                : 'Enterprise-grade physical asset lifecycles & custody engines.'
              }
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {isSignup && (
            <div className="relative">
              <User className="absolute left-4 top-[38px] h-4 w-4 text-[#7F5539]/55 z-10" />
              <Input
                label="Full Name"
                placeholder="Sarah Connor"
                className="pl-11 bg-white/50 border-[#D4A373]/25"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-[38px] h-4 w-4 text-[#7F5539]/55 z-10" />
            <Input
              type="email"
              label="Work Email Address"
              placeholder="sarah@cyberdyne.com"
              className="pl-11 bg-white/50 border-[#D4A373]/25"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 pl-0.5">
              <label className="text-[10px] font-bold text-[#7F5539]/90 uppercase tracking-widest">
                Password
              </label>
              {!isSignup && (
                <Link 
                  to="/forgot-password" 
                  className="text-[10px] font-bold text-[#C98C3A] hover:text-[#B5654A] transition-colors tracking-widest uppercase"
                >
                  Forgot?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-[14px] h-4 w-4 text-[#7F5539]/55 z-10" />
              <input
                type="password"
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-white/50 backdrop-blur-xs border border-[#D4A373]/25 rounded-xl outline-none focus:border-[#C98C3A] focus:ring-4 focus:ring-[#C98C3A]/10 transition-all placeholder:text-[#7F5539]/30 text-[#4E342E] font-medium"
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
            className="w-full mt-3 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all"
          >
            <span className="tracking-wider text-xs uppercase font-black">{isSignup ? 'Register' : 'Access System'}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {/* Form Toggle */}
        <div className="text-center text-xs text-[#7F5539]">
          {isSignup ? (
            <span>
              Already have an account?{' '}
              <button 
                onClick={() => setIsSignup(false)} 
                className="text-[#C98C3A] font-extrabold hover:text-[#B5654A] cursor-pointer hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button 
                onClick={() => setIsSignup(true)} 
                className="text-[#C98C3A] font-extrabold hover:text-[#B5654A] cursor-pointer hover:underline"
              >
                Sign up
              </button>
            </span>
          )}
        </div>

        {/* Sandbox Access Shortcuts (Hackathon Special) */}
        <div className="border-t border-[#D4A373]/20 pt-6 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#7F5539]/80 pl-0.5">
            <ShieldCheck className="h-4 w-4 text-[#C98C3A]" />
            <span>Developer Fast-Pass Credentials</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('admin@assetflow.com')}
              className="px-2 py-2 text-[9px] font-black uppercase tracking-wider border border-[#D4A373]/25 hover:border-[#C98C3A] rounded-xl bg-white/40 text-[#4E342E] hover:bg-[#C98C3A]/10 transition-all duration-300 cursor-pointer truncate shadow-xs"
              title="admin@assetflow.com"
            >
              Admin Role
            </button>
            <button
              onClick={() => handleQuickLogin('manager@assetflow.com')}
              className="px-2 py-2 text-[9px] font-black uppercase tracking-wider border border-[#D4A373]/25 hover:border-[#C98C3A] rounded-xl bg-white/40 text-[#4E342E] hover:bg-[#C98C3A]/10 transition-all duration-300 cursor-pointer truncate shadow-xs"
              title="manager@assetflow.com"
            >
              Manager Role
            </button>
            <button
              onClick={() => handleQuickLogin('employee@assetflow.com')}
              className="px-2 py-2 text-[9px] font-black uppercase tracking-wider border border-[#D4A373]/25 hover:border-[#C98C3A] rounded-xl bg-white/40 text-[#4E342E] hover:bg-[#C98C3A]/10 transition-all duration-300 cursor-pointer truncate shadow-xs"
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
