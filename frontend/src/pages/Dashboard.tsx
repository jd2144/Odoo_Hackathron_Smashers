import * as React from 'react';
import { motion } from 'motion/react';
import { 
  Package, 
  FolderSync, 
  Wrench, 
  CalendarRange, 
  AlertTriangle, 
  PlusCircle, 
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { dashboardService, DashboardStats, UpcomingReturnItem } from '../services/dashboard.service';
import { AssetHistory } from '../types';
import toast from 'react-hot-toast';

// Simple and highly performant animated counter for luxury numbers
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    const duration = 1000; // ms
    const incrementTime = Math.max(Math.floor(duration / (end || 1)), 16);
    const timer = setInterval(() => {
      start += Math.ceil(end / 40);
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}</span>;
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [timeline, setTimeline] = React.useState<AssetHistory[]>([]);
  const [upcomingReturns, setUpcomingReturns] = React.useState<UpcomingReturnItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsData, timelineData, returnsData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getTimeline(6),
          dashboardService.getUpcomingReturnsList()
        ]);
        setStats(statsData);
        setTimeline(timelineData);
        setUpcomingReturns(returnsData);
      } catch (error) {
        toast.error('Failed to load dashboard metrics.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-96 gap-4">
        <svg className="animate-spin h-8 w-8 text-sahara-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-[10px] font-bold text-sahara-clay uppercase tracking-widest">Compiling dashboard data streams...</span>
      </div>
    );
  }

  const kpis = [
    { name: 'Assets Available', value: stats?.assetsAvailable || 0, icon: Package, color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', desc: 'Ready for allocation' },
    { name: 'Assets Allocated', value: stats?.assetsAllocated || 0, icon: FolderSync, color: 'bg-sahara-sand/15 text-sahara-clay border-sahara-sand/35', desc: 'Assigned to employees/depts' },
    { name: 'Active Bookings', value: stats?.activeBookings || 0, icon: CalendarRange, color: 'bg-sahara-gold/15 text-sahara-coffee border-sahara-gold/30', desc: 'Shared slots reserved' },
    { name: 'Active Repairs', value: stats?.maintenanceToday || 0, icon: Wrench, color: 'bg-sahara-terracotta/15 text-sahara-terracotta border-sahara-terracotta/25', desc: 'In engineering queue' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner: Redesigned with Silk Block styling */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sahara-cream/60 via-sahara-light/40 to-transparent p-8 rounded-[22px] border border-sahara-sand/15 shadow-sm">
        {/* Animated silk wave details */}
        <motion.div 
          animate={{
            x: [0, 20, 0],
            y: [0, -10, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[20%] -right-[10%] w-72 h-72 bg-gradient-to-l from-sahara-sand/12 to-transparent blur-2xl pointer-events-none rounded-full" 
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-sahara-gold">Enterprise Operations</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-sahara-coffee font-sans mt-1">Operational Overview</h1>
            <p className="text-xs text-sahara-clay/80 mt-1 max-w-2xl font-semibold leading-relaxed">
              Real-time synchronization of corporate physical assets, scheduling conflict checks, and compliance audits across departments.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button variant="outline" size="sm" className="cursor-pointer rounded-xl text-xs font-bold uppercase tracking-wider">
              Export Report
            </Button>
            <Button variant="primary" size="sm" className="cursor-pointer rounded-xl text-xs font-bold uppercase tracking-wider">
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Quick Allocation
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Grid with Staggered Entrance Animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, type: 'spring', stiffness: 120, damping: 14 }}
            >
              <Card className="silk-card">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[10px] font-black text-sahara-clay/60 uppercase tracking-widest truncate">{kpi.name}</span>
                    <span className="text-4xl font-extrabold text-sahara-coffee">
                      <AnimatedCounter value={kpi.value} />
                    </span>
                    <span className="text-[11px] text-[#7F5539]/80 font-semibold truncate mt-0.5">{kpi.desc}</span>
                  </div>
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className={`h-12 w-12 rounded-xl flex items-center justify-center border flex-shrink-0 shadow-xs ${kpi.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Section split: Left - Upcoming returns, Right - Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming and Overdue returns list */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col justify-between shadow-md">
            <div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Asset Allocation Queue</CardTitle>
                    <CardDescription>Upcoming expected return dispatches requiring check-in auditing.</CardDescription>
                  </div>
                  {stats && stats.overdueReturnsCount > 0 && (
                    <Badge variant="priority-critical" className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {stats.overdueReturnsCount} OVERDUE
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <div className="divide-y divide-sahara-sand/10">
                {upcomingReturns.length === 0 ? (
                  <div className="p-8 text-center text-xs text-sahara-clay/60">
                    No active allocations found in inventory queue.
                  </div>
                ) : (
                  upcomingReturns.slice(0, 4).map((item, index) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={item.id} 
                      className="px-6 py-4.5 flex items-center justify-between gap-4 hover:bg-sahara-sand/5 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-4.5 min-w-0 flex-1">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-mono text-[10px] font-black tracking-wider shadow-xs
                          ${item.isOverdue 
                            ? 'bg-sahara-danger/10 text-sahara-danger border border-sahara-danger/25' 
                            : 'bg-sahara-light/60 text-sahara-clay border border-sahara-sand/20'
                          }
                        `}>
                          {item.assetTag}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-sahara-coffee truncate">{item.name}</span>
                          <span className="text-[11px] text-sahara-clay/70 truncate flex items-center gap-1 font-semibold mt-0.5">
                            <UserCheck className="h-3.5 w-3.5 text-sahara-gold flex-shrink-0" />
                            Assigned to: {item.holderName}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-[11px] font-mono font-bold
                          ${item.isOverdue ? 'text-sahara-danger' : 'text-sahara-clay/70'}
                        `}>
                          Due: {new Date(item.expectedReturnDate).toLocaleDateString()}
                        </span>
                        <Badge variant={item.isOverdue ? 'status-lost' : 'status-allocated'}>
                          {item.isOverdue ? 'Overdue Return' : 'In Possession'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
            
            <CardFooter>
              <span className="text-[11px] text-sahara-clay/60 font-bold uppercase tracking-wider">Monitoring return compliance policies.</span>
              <Button variant="ghost" size="sm" className="text-xs font-black uppercase tracking-wider text-sahara-gold cursor-pointer flex items-center gap-0.5 hover:text-sahara-coffee">
                Manage Allocations
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Live Timeline Audit Logs Feed */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col justify-between shadow-md">
            <div>
              <CardHeader>
                <CardTitle>System Activity Timeline</CardTitle>
                <CardDescription>Live streaming audit logs tracking organizational lifecycle changes.</CardDescription>
              </CardHeader>

              <div className="px-6 py-5 space-y-5">
                {timeline.length === 0 ? (
                  <div className="p-8 text-center text-xs text-sahara-clay/60">
                    No recent events logged.
                  </div>
                ) : (
                  timeline.slice(0, 4).map((item, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      key={item.id} 
                      className="flex gap-4 text-xs"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`h-3.5 w-3.5 rounded-full border-2 border-white mt-1.5 flex-shrink-0 shadow-sm
                          ${item.type === 'Allocation' ? 'bg-sahara-sand' :
                            item.type === 'Transfer' ? 'bg-[#7A8450]' :
                            item.type === 'Maintenance' ? 'bg-sahara-warning' : 'bg-emerald-500'}
                        `} />
                        {idx !== timeline.slice(0, 4).length - 1 && (
                          <div className="w-[1.5px] h-14 bg-sahara-sand/20 my-1 flex-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <span className="font-bold text-sahara-coffee truncate leading-snug">{item.title}</span>
                        <p className="text-sahara-clay/80 leading-relaxed text-[11px] font-medium">{item.description}</p>
                        <span className="text-[10px] text-sahara-clay/55 font-bold uppercase mt-1 tracking-wider">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            <CardFooter>
              <span className="text-[11px] text-sahara-clay/60 font-bold uppercase tracking-wider">Compliance-safe historical log.</span>
              <Button variant="ghost" size="sm" className="text-xs font-black uppercase tracking-wider text-sahara-gold cursor-pointer flex items-center gap-0.5 hover:text-sahara-coffee">
                Audit Trail
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
