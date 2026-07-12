import * as React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Search, 
  ChevronRight, 
  ShieldAlert, 
  Check, 
  SlidersHorizontal
} from 'lucide-react';
import { Employee, Notification, UserRole } from '../../types';
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
    <header className="h-18 mx-6 mt-4 mb-2 bg-white/70 backdrop-blur-xl border border-sahara-sand/15 rounded-2xl flex items-center justify-between px-6 select-none shadow-lg shadow-sahara-clay/3 relative z-40">
      {/* Left section: Breadcrumb hierarchy with serif styled root */}
      <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-sahara-clay/60">
        <Link to="/" className="hover:text-sahara-gold transition-colors font-black text-sahara-coffee">
          AssetFlow
        </Link>
        {pathnames.length === 0 && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-sahara-sand" />
            <span className="text-sahara-coffee/95 font-black">Operational Dashboard</span>
          </>
        )}
        {pathnames.map((path, idx) => {
          const isLast = idx === pathnames.length - 1;
          const to = `/${pathnames.slice(0, idx + 1).join('/')}`;
          
          return (
            <React.Fragment key={to}>
              <ChevronRight className="h-3.5 w-3.5 text-sahara-sand" />
              {isLast ? (
                <span className="text-sahara-coffee/95 font-black truncate max-w-[150px] sm:max-w-none">
                  {getBreadcrumbTitle(path)}
                </span>
              ) : (
                <Link to={to} className="hover:text-sahara-gold transition-colors">
                  {getBreadcrumbTitle(path)}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right section: Global utilities */}
      <div className="flex items-center gap-4">
        {/* Search inside a luxury rounded input */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-sahara-clay/50" />
          <input
            type="text"
            placeholder="Search assets, tags, locations..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white/50 backdrop-blur-xs border border-sahara-sand/25 rounded-xl outline-none focus:border-sahara-gold focus:ring-4 focus:ring-sahara-gold/10 transition-all placeholder:text-sahara-clay/40 text-sahara-coffee font-semibold"
          />
        </div>

        {/* Dynamic Hackathon Role Switcher with custom animations */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowNotificationMenu(false);
            }}
            className="flex items-center gap-1.5 border-dashed border-sahara-gold/70 text-sahara-gold bg-sahara-gold/5 hover:bg-sahara-gold/10 rounded-xl"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-[10px] font-bold">Role:</span>
            <span className="font-extrabold text-[10px]">{user?.role || 'Employee'}</span>
          </Button>

          <AnimatePresence>
            {showRoleMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowRoleMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.95 }}
                  transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
                  className="absolute right-0 mt-2.5 w-56 bg-white/95 backdrop-blur-md border border-sahara-sand/25 rounded-xl shadow-2xl z-20 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-sahara-sand/15 bg-sahara-light/30 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-sahara-gold flex-shrink-0" />
                    <span className="text-[10px] font-black text-sahara-coffee uppercase tracking-wider">Developer Sandbox</span>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    {(['Admin', 'Asset Manager', 'Department Head', 'Employee'] as UserRole[]).map(r => (
                      <button
                        key={r}
                        onClick={() => {
                          onRoleChange(r);
                          setShowRoleMenu(false);
                        }}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-all cursor-pointer
                          ${user?.role === r 
                            ? 'bg-sahara-sand/15 text-sahara-coffee font-extrabold' 
                            : 'hover:bg-sahara-light/50 text-sahara-clay/80 hover:text-sahara-coffee'
                          }
                        `}
                      >
                        <div className="flex flex-col">
                          <span>{r}</span>
                          <span className="text-[9px] text-sahara-clay/55 font-semibold">{roleLabels[r]}</span>
                        </div>
                        {user?.role === r && <Check className="h-3.5 w-3.5 text-sahara-gold" />}
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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowNotificationMenu(!showNotificationMenu);
              setShowRoleMenu(false);
            }}
            className="p-2.5 text-sahara-clay hover:text-sahara-coffee hover:bg-sahara-sand/10 rounded-xl transition-all relative cursor-pointer"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-sahara-danger border-2 border-white animate-pulse" />
            )}
          </motion.button>

          <AnimatePresence>
            {showNotificationMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotificationMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.95 }}
                  transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
                  className="absolute right-0 mt-2.5 w-80 bg-white/95 backdrop-blur-md border border-sahara-sand/25 rounded-xl shadow-2xl z-20 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-sahara-sand/15 flex items-center justify-between bg-sahara-light/30">
                    <span className="text-[10px] font-black text-sahara-coffee uppercase tracking-widest">Recent Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="danger" className="text-[8px] font-extrabold px-1.5 py-0.5">
                        {unreadCount} New
                      </Badge>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-sahara-sand/10">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-sahara-clay/60">
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
                            p-3.5 text-xs transition-colors cursor-pointer hover:bg-sahara-light/40 flex gap-3
                            ${!item.isRead ? 'bg-sahara-sand/5 font-bold' : ''}
                          `}
                        >
                          <div className={`
                            h-7.5 w-7.5 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm
                            ${item.type.includes('Overdue') ? 'bg-sahara-danger/10 text-sahara-danger border border-sahara-danger/20' : 
                              item.type.includes('Approved') ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 
                              item.type.includes('Booking') ? 'bg-sahara-sand/10 text-sahara-clay border border-sahara-sand/20' : 'bg-sahara-gold/10 text-sahara-coffee border border-sahara-gold/20'}
                          `}>
                            <Bell className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <span className="text-sahara-coffee font-extrabold truncate leading-tight">{item.title}</span>
                            <span className="text-sahara-clay/80 text-[11px] line-clamp-2 leading-relaxed">{item.message}</span>
                            <span className="text-[9px] text-sahara-clay/50 font-bold mt-1 uppercase tracking-wider">{new Date(item.createdDate).toLocaleDateString()}</span>
                          </div>
                          {!item.isRead && (
                            <div className="h-2 w-2 rounded-full bg-sahara-gold self-center flex-shrink-0 shadow-sm" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  
                  <Link 
                    to="/notifications" 
                    onClick={() => setShowNotificationMenu(false)}
                    className="block text-center py-3 text-[10px] font-black uppercase tracking-wider text-sahara-gold hover:bg-sahara-light/50 border-t border-sahara-sand/15 transition-all"
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
