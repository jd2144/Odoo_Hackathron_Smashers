import * as React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
      toast.success('Recovery link successfully dispatched!');
    }, 1000);
  };

  return (
    <div className="min-h-screen w-screen overflow-hidden flex flex-col items-center justify-center p-4 relative bg-[#FFF8F0]">
      
      {/* Premium Layered Silk Blocks in background */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{
            x: [0, 40, -10],
            y: [0, -20, 30],
            rotate: [0, 8, -4],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
          className="absolute -top-[10%] -left-[10%] w-[500px] h-[400px] bg-gradient-to-tr from-[#D4A373]/20 via-[#FAF3E0]/30 to-[#E9D8A6]/20 blur-[80px] rounded-full opacity-60"
        />

        <motion.div 
          animate={{
            x: [0, -30, 20],
            y: [0, 30, -20],
            rotate: [0, -6, 10],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
          className="absolute -bottom-[15%] -right-[10%] w-[600px] h-[450px] bg-gradient-to-br from-[#B5654A]/10 via-[#FAF3E0]/20 to-[#C98C3A]/15 blur-[90px] rounded-full opacity-50"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="w-full max-w-md bg-white/75 backdrop-blur-2xl border border-[#D4A373]/30 rounded-[24px] shadow-[0_25px_60px_-15px_rgba(78,52,46,0.12)] p-8 md:p-10 flex flex-col gap-6 relative z-10"
      >
        <div className="flex flex-col items-center text-center gap-3">
          <motion.div 
            whileHover={{ rotate: 45, scale: 1.1 }}
            className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#D4A373] to-[#C98C3A] flex items-center justify-center text-white shadow-xl shadow-[#C98C3A]/20"
          >
            <div className="w-5 h-5 bg-white rounded-md rotate-45" />
          </motion.div>
          <div className="flex flex-col gap-1 mt-1">
            <h1 className="text-2xl font-black tracking-tight text-[#4E342E] font-sans">
              Reset Password
            </h1>
            <p className="text-xs text-[#7F5539]/80 font-semibold max-w-xs leading-relaxed">
              We will dispatch an ERP password synchronization and restoration package to your inbox.
            </p>
          </div>
        </div>

        {!isSent ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

            <Button 
              type="submit" 
              isLoading={isLoading} 
              className="w-full mt-2 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all"
            >
              <Send className="h-4 w-4" />
              <span className="tracking-wider text-xs uppercase font-black">Send Recovery Package</span>
            </Button>
          </form>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-5 flex flex-col gap-3 text-center">
            <span className="text-xs uppercase tracking-widest font-black text-emerald-800">Check your inbox</span>
            <p className="text-xs text-emerald-700/90 leading-relaxed font-semibold">
              An encryption link has been transmitted to <strong className="text-emerald-800 font-extrabold">{email}</strong>. It will expire in 30 minutes.
            </p>
          </div>
        )}

        <Link 
          to="/login" 
          className="flex items-center justify-center gap-2 text-[10px] font-bold text-sahara-clay hover:text-sahara-gold tracking-widest uppercase transition-colors cursor-pointer self-center mt-2"
        >
          <ArrowLeft className="h-4 w-4 text-sahara-gold" />
          Back to Login
        </Link>
      </motion.div>
    </div>
  );
};
export default ForgotPassword;
