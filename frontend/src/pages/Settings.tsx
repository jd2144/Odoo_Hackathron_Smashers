import * as React from 'react';
import { Sliders, RefreshCw, UserCheck, ShieldCheck, Mail, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MockDatabase } from '../services/mockDb';
import toast from 'react-hot-toast';

// ==============================
// BACKEND INTEGRATION
// Page: Account Settings
//
// API Endpoints Required:
// 1. GET /api/auth/me
//    - Authentication: JWT Required
//    - Response: Employee
// 
// 2. PUT /api/auth/me
//    - Authentication: JWT Required
//    - Request Body: { name: string, email: string }
//    - Response: Employee
// 
// 3. POST /api/db/reset
//    - Authentication: JWT Required (Admin only / Dev mode only)
//    - Response: { success: true }
//
// Error Handling:
// - Standard 401: Unauthorized (Redirect to login)
// - Standard 400: Bad Request (Invalid validation errors)
// - Standard 500: Display toast message on failure
// ==============================

export const Settings: React.FC = () => {
  // TODO(BACKEND):
  // Replace with API response from GET /api/auth/me
  const [activeUser, setActiveUser] = React.useState<any>(null);
  const [profileName, setProfileName] = React.useState('');
  const [profileEmail, setProfileEmail] = React.useState('');

  React.useEffect(() => {
    const user = MockDatabase.getActiveUser();
    if (user) {
      setActiveUser(user);
      setProfileName(user.name);
      setProfileEmail(user.email);
    }
  }, []);

  // BACKEND API
  // Method: PUT
  // Endpoint: /api/auth/me
  // Authentication: JWT Required
  // Request DTO: { name: string, email: string }
  // Response DTO: Employee
  // Expected Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim()) {
      toast.error('Name and Email are required.');
      return;
    }

    // TODO(BACKEND): Send PUT /api/auth/me request
    const updated = {
      ...activeUser,
      name: profileName,
      email: profileEmail
    };
    MockDatabase.saveActiveUser(updated);
    
    // Update matching employee
    const emps = MockDatabase.getEmployees();
    const idx = emps.findIndex(e => e.id === activeUser.id);
    if (idx !== -1) {
      emps[idx].name = profileName;
      emps[idx].email = profileEmail;
      MockDatabase.saveEmployees(emps);
    }

    toast.success('Profile preferences saved locally.');
    window.dispatchEvent(new Event('storage')); // trigger layout update
  };

  // BACKEND API
  // Method: POST
  // Endpoint: /api/db/reset
  // Authentication: JWT Required (Admin Only)
  // Expected Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden
  const handleResetDatabase = () => {
    if (window.confirm('This will wipe all custom bookings, allocations, and repair records, resetting the applet back to original seed data. Proceed?')) {
      // TODO(BACKEND): Call POST /api/db/reset and clear token if needed
      localStorage.clear();
      // Reload page to re-seed
      toast.success('Database initialized to seed defaults.');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  if (!activeUser) {
    return <div className="text-center py-20 text-xs font-bold text-brand-muted uppercase tracking-wider">Loading system preferences...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-text">Account Settings</h1>
        <p className="text-xs text-brand-muted">Configure profile info, regulate administrative preferences, and monitor ERP database states.</p>
      </div>

      {/* Profile Form */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Profile Preferences</CardTitle>
          <CardDescription>Adjust your active identity. These changes reflect across allocations and bookings instantly.</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          {/* TODO(BACKEND): Handle Form Submission for profile updates */}
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Corporate Name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
              />
              <Input
                type="email"
                label="Active Work Email Address"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs text-brand-muted bg-gray-50 p-3 rounded-lg border border-brand-border/60">
              <ShieldCheck className="h-4.5 w-4.5 text-brand-success flex-shrink-0" />
              <div>
                Current Access Authorization Role: <strong className="text-brand-text font-bold uppercase">{activeUser.role}</strong>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-brand-border/50">
              <Button type="submit" className="px-6 cursor-pointer font-bold text-xs">Save Identity Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Database control panel */}
      <Card className="border-red-100 bg-red-50/20">
        <CardHeader>
          <CardTitle className="text-brand-text text-sm font-extrabold uppercase tracking-wide">Danger Zone</CardTitle>
          <CardDescription className="text-xs">Irreversible database actions. Use with caution during hackathon presentations.</CardDescription>
        </CardHeader>
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-red-100 mt-2">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-brand-danger mt-0.5 flex-shrink-0" />
            <div className="flex flex-col text-xs">
              <strong className="text-brand-text font-bold">Reset Local Sandbox Database</strong>
              <span className="text-brand-muted">Purges all localStorage mutations, restoring initial demo assets, bookings, and users.</span>
            </div>
          </div>
          {/* TODO(BACKEND): Factory reset action */}
          <Button 
            variant="outline" 
            onClick={handleResetDatabase}
            className="cursor-pointer text-xs font-bold text-brand-danger border-red-200 hover:bg-rose-50"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Factory Reset Seed
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
export default Settings;
