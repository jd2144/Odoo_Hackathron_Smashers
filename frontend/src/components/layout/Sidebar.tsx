import * as React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Building2, 
  Package, 
  CalendarRange, 
  ClipboardCheck, 
  Wrench, 
  FileBarChart, 
  Bell, 
  Settings, 
  LogOut, 
  FolderSync,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User
} from 'lucide-react';
import { Employee } from '../../types';
import { MockDatabase } from '../../services/mockDb';

interface SidebarProps {
  user: Employee | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Organization Setup', path: '/organization', icon: Building2, roles: ['Admin'] },
    { name: 'Asset Management', path: '/assets', icon: Package, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Asset Allocation', path: '/allocations', icon: FolderSync, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Resource Booking', path: '/bookings', icon: CalendarRange, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Asset Audit', path: '/audits', icon: ClipboardCheck, roles: ['Admin', 'Asset Manager', 'Department Head'] },
    { name: 'Reports', path: '/reports', icon: FileBarChart, roles: ['Admin', 'Asset Manager'] },
    { name: 'Notifications', path: '/notifications', icon: Bell, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
  ];

  // Filter links based on current user role
  const userRole = user?.role || 'Employee';
  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <motion.aside
      animate={{ width: isCollapsed ? '72px' : '260px' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-screen bg-white text-brand-muted border-r border-brand-border flex flex-col justify-between relative select-none"
    >
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-brand-primary text-white rounded-full p-1 shadow-md hover:bg-opacity-90 focus:outline-none border border-brand-border z-10"
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Brand Logo and Title */}
      <div>
        <div className="h-16 flex items-center px-5 border-b border-brand-border gap-3 overflow-hidden">
          <div className="h-8 w-8 rounded-lg bg-brand-primary flex items-center justify-center text-white flex-shrink-0">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
          </div>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              <span className="font-bold text-brand-text tracking-tight text-sm">AssetFlow</span>
              <span className="text-[10px] text-brand-secondary uppercase font-semibold tracking-wider">Enterprise ERP</span>
            </motion.div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {filteredItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  relative flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                  ${isActive 
                    ? 'text-brand-primary font-semibold' 
                    : 'text-brand-muted hover:text-brand-text hover:bg-gray-50'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 bg-brand-primary/10 rounded-lg -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-brand-primary' : 'text-brand-muted group-hover:text-brand-text'}`} />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {item.name}
                  </motion.span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile section */}
      <div className="p-3.5 border-t border-brand-border bg-gray-50/50">
        {!isCollapsed ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80'}
                alt={user?.name || 'User'}
                className="h-10 w-10 rounded-full border border-brand-border object-cover flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-brand-text truncate">{user?.name || 'Alexander Wright'}</span>
                <span className="text-xs text-brand-muted truncate flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-secondary flex-shrink-0" />
                  {user?.role || 'Employee'}
                </span>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg bg-red-50 text-brand-danger border border-red-100 hover:bg-brand-danger hover:text-white transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80'}
              alt={user?.name || 'User'}
              className="h-9 w-9 rounded-full border border-brand-border object-cover"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2.5 rounded-lg text-brand-danger hover:bg-red-50 transition-all cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
};
