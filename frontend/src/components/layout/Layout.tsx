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
    <div className="flex h-screen w-screen overflow-hidden bg-[#FFF8F0] relative">
      {/* Decorative Layered Animated Background Blobs / Silk Curves */}
      <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
        {/* Floating silk blocks */}
        <div className="absolute top-[10%] left-[5%] w-[450px] h-[350px] bg-gradient-to-tr from-[#E9D8A6]/20 to-[#D4A373]/10 blur-[90px] rounded-full animate-[silkFloat_25s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-[15%] right-[10%] w-[500px] h-[400px] bg-gradient-to-br from-[#F4A261]/10 to-[#C98C3A]/8 blur-[100px] rounded-full animate-[silkFloat_35s_ease-in-out_infinite_alternate_reverse]" />
        <div className="absolute top-[60%] left-[20%] w-[380px] h-[380px] bg-gradient-to-tr from-[#FAF3E0]/25 to-[#E9D8A6]/8 blur-[80px] rounded-full animate-[silkFloat_28s_ease-in-out_infinite_alternate_8s]" />
        
        {/* Silk curves & Sand waves */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <path d="M-100,200 C300,400 500,-100 900,300 C1300,700 1500,200 1900,500" fill="none" stroke="url(#duneGradient)" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M0,600 C400,300 700,800 1100,400 C1500,0 1700,600 2100,300" fill="none" stroke="url(#duneGradient)" strokeWidth="1" />
          <defs>
            <linearGradient id="duneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4A373" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#C98C3A" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#B5654A" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Sidebar - collapsible, handles role filtering */}
      <Sidebar user={currentUser} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative">
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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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
            background: 'rgba(255, 254, 252, 0.95)',
            color: '#4E342E',
            border: '1px solid rgba(212, 163, 115, 0.3)',
            backdropFilter: 'blur(10px)',
            fontSize: '13px',
            fontWeight: '600',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            borderRadius: '16px',
            boxShadow: '0 12px 30px rgba(127, 85, 57, 0.1)',
            padding: '12px 18px',
          },
          success: {
            iconTheme: {
              primary: '#4CAF50',
              secondary: '#FFF8F0',
            },
          },
          error: {
            iconTheme: {
              primary: '#E76F51',
              secondary: '#FFF8F0',
            },
          },
        }}
      />
    </div>
  );
};
export default Layout;
