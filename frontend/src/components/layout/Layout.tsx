import * as React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Employee, Notification, UserRole } from '../../types';
import { MockDatabase } from '../../services/mockDb';
import { Toaster } from 'react-hot-toast';

interface LayoutProps {
  user?: Employee | null;
  onLogout?: () => void;
  onRoleChange?: (newRole: UserRole) => void;
  notifications?: Notification[];
  onMarkNotificationAsRead?: (id: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  user,
  onLogout,
  onRoleChange,
  notifications,
  onMarkNotificationAsRead
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Local state fallbacks if props are not supplied (e.g. during Route rendering)
  const [localUser, setLocalUser] = React.useState<Employee | null>(() => MockDatabase.getActiveUser());
  const [localNotifications, setLocalNotifications] = React.useState<Notification[]>(() => MockDatabase.getNotifications());

  // Keep state synchronized with database on route change
  React.useEffect(() => {
    setLocalUser(MockDatabase.getActiveUser());
    setLocalNotifications(MockDatabase.getNotifications());
  }, [location.pathname]);

  // Support local state triggers for immediate responsiveness
  const currentUser = user !== undefined ? user : localUser;
  const currentNotifications = notifications !== undefined ? notifications : localNotifications;

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      MockDatabase.saveActiveUser(null);
      setLocalUser(null);
      navigate('/login');
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    if (onRoleChange) {
      onRoleChange(newRole);
    } else {
      const active = MockDatabase.getActiveUser();
      if (active) {
        const updated = { ...active, role: newRole };
        MockDatabase.saveActiveUser(updated);
        setLocalUser(updated);
        // Dispatch event for local component reactivity
        window.dispatchEvent(new Event('storage'));
      }
    }
  };

  const handleMarkNotificationAsRead = (id: string) => {
    if (onMarkNotificationAsRead) {
      onMarkNotificationAsRead(id);
    } else {
      const notifs = MockDatabase.getNotifications();
      const updated = notifs.map(n => n.id === id ? { ...n, isRead: true } : n);
      localStorage.setItem('assetflow_notifications', JSON.stringify(updated));
      setLocalNotifications(updated);
      window.dispatchEvent(new Event('storage'));
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-background">
      {/* Sidebar - collapsible, handles role filtering */}
      <Sidebar user={currentUser} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Navbar - handles breadcrumbs, sandbox role-switch, notification dropdown */}
        <Navbar 
          user={currentUser} 
          onRoleChange={handleRoleChange} 
          notifications={currentNotifications}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          {/* Elegant Page Transitions with Framer Motion */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="h-full flex flex-col gap-6"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Notifications Toast Container */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #E5E7EB',
            fontSize: '13px',
            fontWeight: '500',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </div>
  );
};
export default Layout;
