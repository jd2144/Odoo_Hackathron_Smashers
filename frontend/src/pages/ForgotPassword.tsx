import * as React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

// ==============================
// BACKEND INTEGRATION
// Page: Forgot Password
//
// API Endpoints Required:
// 1. POST /api/auth/forgot-password
//    - Authentication: None (Public)
//    - Request Body: { email: string }
//    - Response: { success: true }
// ==============================

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);

  // BACKEND API
  // Method: POST
  // Endpoint: /api/auth/forgot-password
  // Authentication: None (Public)
  // Request DTO: { email: string }
  // Expected Status Codes: 200 OK, 400 Bad Request
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required.');
      return;
    }

    setIsLoading(true);
    // TODO(BACKEND):
    // Replace with actual API call to POST /api/auth/forgot-password
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
      toast.success('Recovery link successfully dispatched!');
    }, 1000);
  };

  return (
    <div className="min-h-screen w-screen bg-brand-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white border border-brand-border rounded-2xl shadow-xl p-8 flex flex-col gap-6"
      >
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-md shadow-brand-primary/10">
            <div className="w-5 h-5 bg-white rounded-sm rotate-45"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-brand-text">
            Reset Password
          </h1>
          <p className="text-xs text-brand-muted max-w-xs">
            We will dispatch an ERP password synchronization and restoration package to your inbox.
          </p>
        </div>

        {!isSent ? (
          /* TODO(BACKEND): Handle password recovery email transmission */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            <Button 
              type="submit" 
              isLoading={isLoading} 
              className="w-full mt-2 font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              Send Recovery Package
            </Button>
          </form>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col gap-3 text-center">
            <span className="text-sm font-semibold text-emerald-800">Check your inbox</span>
            <p className="text-xs text-emerald-600">
              An encryption link has been transmitted to <strong className="text-emerald-800">{email}</strong>. It will expire in 30 minutes.
            </p>
          </div>
        )}

        <Link 
          to="/login" 
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-brand-muted hover:text-brand-primary transition-colors cursor-pointer self-center"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </motion.div>
    </div>
  );
};
export default ForgotPassword;
