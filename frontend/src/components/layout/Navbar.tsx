import * as React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Search, 
  ChevronRight, 
  User, 
  ShieldAlert, 
  Check, 
  SlidersHorizontal,
  Mail,
  UserCheck,
  Building
} from 'lucide-react';
import { Employee, Notification, UserRole } from '../../types';
import { MockDatabase } from '../../services/mockDb';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface NavbarProps {
  user: Employee | null;
  onRoleChange: (newRole: UserRole) => void;
  notifications: Notification[];
  onMarkNotificationAsRead: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  onRoleChange, 
  notifications,
  onMarkNotificationAsRead
}) => {
  const location = useLocation();
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = React.useState(false);

  // Derive breadcrumbs from path
  const pathnames = location.pathname.split('/').filter(x => x);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const roleLabels: Record<UserRole, string> = {
    'Admin': 'Administrator',
    'Asset Manager': 'Asset Manager',
    'Department Head': 'Department Head',
    'Employee': 'Staff Employee'
  };

  const getBreadcrumbTitle = (path: string) => {
    switch (path) {
      case 'organization': return 'Organization Setup';
      case 'assets': return 'Asset Directory';
      case 'allocations': return 'Asset Allocation';
      case 'bookings': return 'Resource Bookings';
      case 'maintenance': return 'Maintenance Ticket Logs';
      case 'audits': return 'Asset Verification Audits';
      case 'reports': return 'Reports & Analytics';
      case 'notifications': return 'All Notifications';
      case 'settings': return 'System Settings';
      default: return path.charAt(0).toUpperCase() + path.slice(1);
    }
  };

  return (
    <header className="h-16 border-b border-brand-border bg-white flex items-center justify-between px-6 select-none relative z-40">
      {/* Left section: Breadcrumb hierarchy */}
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">
        <Link to="/" className="hover:text-brand-primary transition-colors">
          AssetFlow
        </Link>
        {pathnames.length === 0 && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-brand-text">Operational Dashboard</span>
          </>
        )}
        {pathnames.map((path, idx) => {
          const isLast = idx === pathnames.length - 1;
          const to = `/${pathnames.slice(0, idx + 1).join('/')}`;
          
          return (
            <React.Fragment key={to}>
              <ChevronRight className="h-3.5 w-3.5" />
              {isLast ? (
                <span className="text-brand-text truncate max-w-[150px] sm:max-w-none">
                  {getBreadcrumbTitle(path)}
                </span>
              ) : (
                <Link to={to} className="hover:text-brand-primary transition-colors">
                  {getBreadcrumbTitle(path)}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right section: Global utilities */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-muted" />
          <input
            type="text"
            placeholder="Search assets, tags, location..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-brand-background border border-brand-border rounded-lg outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 transition-all placeholder:text-brand-muted/70"
          />
        </div>

        {/* Dynamic Hackathon Role Switcher */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowNotificationMenu(false);
            }}
            className="flex items-center gap-1.5 border-dashed border-brand-primary text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Role:</span>
            <span className="font-bold">{user?.role || 'Employee'}</span>
          </Button>

          <AnimatePresence>
            {showRoleMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowRoleMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white border border-brand-border rounded-xl shadow-lg z-20 overflow-hidden"
                >
                  <div className="px-4 py-2.5 border-b border-brand-border bg-gray-50 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-brand-secondary flex-shrink-0" />
                    <span className="text-xs font-bold text-brand-text uppercase tracking-wide">Developer Sandbox</span>
                  </div>
                  <div className="p-1 space-y-0.5">
                    {(['Admin', 'Asset Manager', 'Department Head', 'Employee'] as UserRole[]).map(r => (
                      <button
                        key={r}
                        onClick={() => {
                          onRoleChange(r);
                          setShowRoleMenu(false);
                        }}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors cursor-pointer
                          ${user?.role === r 
                            ? 'bg-brand-primary/10 text-brand-primary font-semibold' 
                            : 'hover:bg-gray-50 text-brand-text'
                          }
                        `}
                      >
                        <div className="flex flex-col">
                          <span>{r}</span>
                          <span className="text-[10px] text-brand-muted font-normal">{roleLabels[r]}</span>
                        </div>
                        {user?.role === r && <Check className="h-3.5 w-3.5 text-brand-primary" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotificationMenu(!showNotificationMenu);
              setShowRoleMenu(false);
            }}
            className="p-2 text-brand-muted hover:text-brand-text hover:bg-gray-100 rounded-lg transition-all relative cursor-pointer"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-danger animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotificationMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotificationMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-white border border-brand-border rounded-xl shadow-lg z-20 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between bg-gray-50">
                    <span className="text-xs font-bold text-brand-text uppercase tracking-wide">Recent Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="danger" className="text-[10px]">
                        {unreadCount} New
                      </Badge>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-brand-border">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-brand-muted">
                        No recent notifications.
                      </div>
                    ) : (
                      notifications.slice(0, 5).map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => {
                            onMarkNotificationAsRead(item.id);
                          }}
                          className={`
                            p-3 text-xs transition-colors cursor-pointer hover:bg-gray-50 flex gap-2.5
                            ${!item.isRead ? 'bg-brand-primary/5 font-medium' : ''}
                          `}
                        >
                          <div className={`
                            h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                            ${item.type.includes('Overdue') ? 'bg-red-50 text-brand-danger' : 
                              item.type.includes('Approved') ? 'bg-emerald-50 text-brand-success' : 
                              item.type.includes('Booking') ? 'bg-indigo-50 text-brand-primary' : 'bg-amber-50 text-brand-warning'}
                          `}>
                            <Bell className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <span className="text-brand-text font-semibold truncate">{item.title}</span>
                            <span className="text-brand-muted text-[11px] line-clamp-2">{item.message}</span>
                            <span className="text-[10px] text-brand-muted mt-1">{new Date(item.createdDate).toLocaleDateString()}</span>
                          </div>
                          {!item.isRead && (
                            <div className="h-1.5 w-1.5 rounded-full bg-brand-primary self-center flex-shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  
                  <Link 
                    to="/notifications" 
                    onClick={() => setShowNotificationMenu(false)}
                    className="block text-center py-2.5 text-xs font-bold text-brand-primary hover:bg-gray-50 border-t border-brand-border transition-all"
                  >
                    View All Notifications
                  </Link>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
