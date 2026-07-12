import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  ShieldCheck
} from 'lucide-react';
import { Employee } from '../../types';
import { APP } from '../../constants/app';

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
    { name: 'User Approvals', path: '/approvals', icon: ShieldCheck, roles: ['Admin'] },
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
      animate={{ width: isCollapsed ? '80px' : '270px' }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="h-[calc(100vh-2rem)] my-4 ml-4 bg-white/70 backdrop-blur-xl border border-sahara-sand/15 rounded-2xl flex flex-col justify-between relative select-none shadow-2xl shadow-sahara-clay/5 z-40"
    >
      {/* Sidebar Toggle Button with subtle glow hover */}
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="absolute -right-3 top-8 bg-gradient-to-r from-sahara-sand to-sahara-gold text-white rounded-full p-1.5 shadow-md hover:shadow-lg hover:shadow-sahara-gold/30 border border-sahara-sand/10 z-50 cursor-pointer"
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </motion.button>

      {/* Brand Logo and Title */}
      <div>
        <div className="h-20 flex items-center px-6 border-b border-sahara-sand/10 gap-3.5 overflow-hidden">
          <motion.div 
            whileHover={{ rotate: 45 }}
            className="h-9 w-9 rounded-xl bg-gradient-to-br from-sahara-sand to-sahara-gold flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-sahara-gold/20"
          >
            <div className="w-4 h-4 bg-white/90 rounded-sm rotate-45" />
          </motion.div>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="font-extrabold text-sahara-coffee tracking-tight text-base font-sans">{APP.NAME}</span>
              <span className="text-[9px] text-sahara-gold uppercase font-black tracking-widest leading-none mt-0.5">Enterprise ERP</span>
            </motion.div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
          {filteredItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group
                  ${isActive 
                    ? 'text-sahara-coffee' 
                    : 'text-sahara-clay/70 hover:text-sahara-coffee hover:bg-sahara-sand/5'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-sahara-sand/15 to-sahara-gold/5 rounded-xl border-l-[3.5px] border-sahara-gold"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}
                
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-sahara-gold' : 'text-sahara-clay/60 group-hover:text-sahara-coffee'}`} />
                </motion.div>

                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate"
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
      <div className="p-4 border-t border-sahara-sand/10 bg-sahara-light/20 rounded-b-2xl">
        {!isCollapsed ? (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3 bg-white/40 p-2 rounded-xl border border-sahara-sand/10">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80'}
                alt={user?.name || 'User'}
                className="h-10 w-10 rounded-xl border border-sahara-sand/20 object-cover flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-sahara-coffee truncate">{user?.name || 'Alexander Wright'}</span>
                <span className="text-[10px] text-sahara-gold truncate flex items-center gap-1 font-bold">
                  <ShieldCheck className="h-3.5 w-3.5 text-sahara-gold flex-shrink-0" />
                  {user?.role || 'Employee'}
                </span>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl bg-sahara-danger/10 text-sahara-danger border border-sahara-danger/20 hover:bg-sahara-danger hover:text-white transition-all duration-300 cursor-pointer shadow-sm hover:shadow-sahara-danger/20"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80'}
              alt={user?.name || 'User'}
              className="h-10 w-10 rounded-xl border border-sahara-sand/20 object-cover"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2.5 rounded-xl text-sahara-danger bg-sahara-danger/5 border border-sahara-danger/10 hover:bg-sahara-danger hover:text-white transition-all duration-300 cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
};
