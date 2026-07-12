import * as React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MockDatabase } from './services/mockDb';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WaitingForApprovalView, RejectedUserView } from './components/layout/PendingRejectedViews';

// Layout & Navigation components
import { Layout } from './components/layout/Layout';

// Pages
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { OrganizationSetup } from './pages/OrganizationSetup';
import { AssetManagement } from './pages/AssetManagement';
import { AssetAllocationPage } from './pages/AssetAllocation';
import { ResourceBookingPage } from './pages/ResourceBooking';
import { MaintenancePage } from './pages/Maintenance';
import { AssetAuditPage } from './pages/AssetAudit';
import { Reports } from './pages/Reports';
import { NotificationsPage } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { UserApprovalCenter } from './pages/UserApprovalCenter';

// Protected Route Shield
interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[#FFF8F0]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-sahara-gold/30 border-t-sahara-gold animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest text-sahara-clay animate-pulse">
            Authenticating Active Session...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle registration status guards
  if (user.status === 'Pending Approval') {
    return <WaitingForApprovalView />;
  }

  if (user.status === 'Rejected') {
    return <RejectedUserView />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Show a professional, stylized "403 Unauthorized Access" screen inside the ERP layout
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-[75vh] gap-6 text-center px-6 bg-white/50 border border-[#D4A373]/20 rounded-3xl m-6">
        <div className="h-16 w-16 rounded-2xl bg-sahara-danger/10 border border-sahara-danger/15 flex items-center justify-center text-sahara-danger text-2xl font-black shadow-inner">
          403
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-md font-black text-sahara-coffee uppercase tracking-wider">Access Restriction Protocol</h2>
          <p className="text-xs text-sahara-clay max-w-sm mt-1 leading-relaxed font-semibold">
            Directory access restricted. Your current security clearance level (<strong className="text-sahara-gold uppercase font-black">{user.role}</strong>) does not hold authorization credentials for administrative ERP control panels.
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-6 py-2.5 bg-sahara-coffee text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-sahara-coffee/90 shadow-md transition-all cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return children;
};

export const App: React.FC = () => {
  // Initialize mock databases on app mount
  React.useEffect(() => {
    MockDatabase.initialize();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              fontSize: '12px',
              borderRadius: '10px',
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              fontWeight: '500'
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#ffffff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#ffffff',
              },
            },
          }}
        />

        <Routes>
          {/* Public Paths */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Inner Layout Paths */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Main Dashboard redirection */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="assets" element={<AssetManagement />} />
            <Route path="allocations" element={<AssetAllocationPage />} />
            <Route path="bookings" element={<ResourceBookingPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="audits" element={<AssetAuditPage />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<Settings />} />

            {/* Admin Restricted Paths */}
            <Route path="organization" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <OrganizationSetup />
              </ProtectedRoute>
            } />
            <Route path="approvals" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <UserApprovalCenter />
              </ProtectedRoute>
            } />
          </Route>

          {/* Global Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
