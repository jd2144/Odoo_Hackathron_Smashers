import * as React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MockDatabase } from './services/mockDb';

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

// Protected Route Shield
interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const activeUser = MockDatabase.getActiveUser();

  if (!activeUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(activeUser.role)) {
    // Show a graceful role restriction screen inside the layout
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-96 gap-4 text-center px-4">
        <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-brand-warning text-lg font-bold">
          !
        </div>
        <div>
          <h2 className="text-sm font-bold text-brand-text">Access Restriction Policy</h2>
          <p className="text-xs text-brand-muted max-w-xs mt-1 leading-relaxed">
            Your current authorization role (<strong className="text-brand-text uppercase">{activeUser.role}</strong>) does not hold credentials for master administrative panels.
          </p>
        </div>
        <Navigate to="/dashboard" replace={false} />
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
    <BrowserRouter>
      {/* Visual Alerts Feed Layer */}
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
        </Route>

        {/* Global Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
