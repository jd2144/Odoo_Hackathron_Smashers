import * as React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, ShieldCheck, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SessionService } from '../services/session.service';
import { apiClient } from '../api/apiClient';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const [activeUser, setActiveUser] = React.useState<any>(null);
  const [profileName, setProfileName] = React.useState('');
  const [profileEmail, setProfileEmail] = React.useState('');

  React.useEffect(() => {
    const user = SessionService.getActiveSession();
    if (user) {
      setActiveUser(user);
      setProfileName(user.name);
      setProfileEmail(user.email);
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim()) {
      toast.error('Name and Email are required.');
      return;
    }

    try {
      const updated = {
        ...activeUser,
        name: profileName,
        email: profileEmail
      };
      
      // Persist to backend
      await apiClient.put('/api/auth/me', {
        name: profileName,
        email: profileEmail,
      });

      // Save locally
      localStorage.setItem('aureon_currentUser', JSON.stringify(updated));
      toast.success('Profile preferences successfully saved.');
      window.dispatchEvent(new Event('storage'));
    } catch {
      // Direct local save as fallback
      const updated = {
        ...activeUser,
        name: profileName,
        email: profileEmail
      };
      localStorage.setItem('aureon_currentUser', JSON.stringify(updated));
      toast.success('Profile preferences saved.');
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm('This will wipe all custom bookings, allocations, and repair records. Proceed?')) {
      try {
        await apiClient.post('/api/system/reset');
      } catch {
        // ignore
      }
      localStorage.clear();
      toast.success('Database initialized to seed defaults.');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  if (!activeUser) {
    return (
      <div className="text-center py-24 text-[10px] font-black text-sahara-gold uppercase tracking-widest">
        Loading system preferences...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-sahara-coffee">Account Settings</h1>
        <p className="text-xs text-sahara-clay/70 font-semibold leading-relaxed">Configure profile info, regulate administrative preferences, and monitor ERP database states.</p>
      </div>

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-white/80 backdrop-blur-md shadow-md">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider text-sahara-coffee">Profile Preferences</CardTitle>
            <CardDescription className="text-sahara-clay/70 font-semibold">Adjust your active identity. These changes reflect across allocations and bookings instantly.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Full Corporate Name"
                  value={profileName}
                  className="bg-white/60"
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                />
                <Input
                  type="email"
                  label="Active Work Email Address"
                  value={profileEmail}
                  className="bg-white/60"
                  onChange={(e) => setProfileEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex items-center gap-3 text-xs text-sahara-coffee bg-sahara-light/40 p-4 rounded-xl border border-sahara-sand/30 font-semibold shadow-xs">
                <ShieldCheck className="h-5 w-5 text-sahara-gold flex-shrink-0" />
                <div>
                  Current Access Authorization Role: <span className="text-sahara-coffee font-extrabold uppercase bg-sahara-sand/15 px-2 py-0.5 rounded-md text-[10px] tracking-wider">{activeUser.role}</span>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-sahara-sand/10">
                <Button type="submit" className="px-6 rounded-xl text-xs uppercase tracking-wider font-extrabold cursor-pointer py-3 shadow-md">Save Identity Changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Database control panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-sahara-danger/25 bg-sahara-danger/5 shadow-xs">
          <CardHeader>
            <CardTitle className="text-sahara-danger text-[10px] font-black uppercase tracking-widest">Danger Zone</CardTitle>
            <CardDescription className="text-sahara-clay/70 font-semibold">Irreversible database actions. Use with caution during administrative inspections.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-t border-sahara-danger/10 mt-2">
            <div className="flex items-start gap-3.5">
              <Database className="h-5 w-5 text-sahara-danger mt-0.5 flex-shrink-0" />
              <div className="flex flex-col text-xs font-semibold gap-0.5">
                <strong className="text-sahara-coffee font-extrabold">Reset Local Sandbox Database</strong>
                <span className="text-sahara-clay/70 font-medium">Purges all localStorage mutations, restoring initial demo assets, bookings, and users.</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleResetDatabase}
              className="cursor-pointer text-[10px] uppercase tracking-wider font-black text-sahara-danger border-sahara-danger/25 hover:bg-sahara-danger/10 rounded-xl py-2.5 px-4"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Factory Reset Seed
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
export default Settings;
