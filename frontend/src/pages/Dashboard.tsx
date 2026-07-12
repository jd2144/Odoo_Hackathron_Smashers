import * as React from 'react';
import { 
  Package, 
  FolderSync, 
  Wrench, 
  CalendarRange, 
  TrendingUp, 
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

// ==============================
// BACKEND INTEGRATION
// Page: Operational Overview Dashboard
//
// API Endpoints Required:
// 1. GET /api/dashboard/stats
//    - Authentication: JWT Required
//    - Response: DashboardStats { assetsAvailable, assetsAllocated, maintenanceToday, activeBookings, pendingTransfers, upcomingReturns, overdueReturnsCount }
// 
// 2. GET /api/dashboard/timeline?limit=6
//    - Authentication: JWT Required
//    - Response: AssetHistory[]
// 
// 3. GET /api/dashboard/upcoming-returns
//    - Authentication: JWT Required
//    - Response: UpcomingReturnItem[]
//
// Error Handling:
// - Standard 401: Unauthorized (Redirect to Login)
// - Standard 500: Display toast message "Failed to load dashboard metrics."
// ==============================

export const Dashboard: React.FC = () => {
  // TODO(BACKEND):
  // Replace with API response from GET /api/dashboard/stats
  const [stats, setStats] = React.useState<DashboardStats | null>(null);

  // TODO(BACKEND):
  // Replace with API response from GET /api/dashboard/timeline
  const [timeline, setTimeline] = React.useState<AssetHistory[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/dashboard/upcoming-returns
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
      <div className="flex-1 flex flex-col justify-center items-center h-96 gap-3">
        <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Compiling dashboard data streams...</span>
      </div>
    );
  }

  const kpis = [
    { name: 'Assets Available', value: stats?.assetsAvailable || 0, icon: Package, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', desc: 'Ready for allocation' },
    { name: 'Assets Allocated', value: stats?.assetsAllocated || 0, icon: FolderSync, color: 'bg-indigo-50 text-indigo-600 border-indigo-100', desc: 'Assigned to employees/depts' },
    { name: 'Active Bookings', value: stats?.activeBookings || 0, icon: CalendarRange, color: 'bg-purple-50 text-purple-600 border-purple-100', desc: 'Shared slots reserved' },
    { name: 'Active Repairs', value: stats?.maintenanceToday || 0, icon: Wrench, color: 'bg-orange-50 text-orange-600 border-orange-100', desc: 'In engineering queue' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">Operational Overview</h1>
          <p className="text-xs text-brand-muted">Real-time status of physical assets, scheduling conflict checks, and compliance audits.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="cursor-pointer">
            Export Report
          </Button>
          <Button variant="primary" size="sm" className="cursor-pointer">
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Quick Allocation
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="hover-lift">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-xs font-bold text-brand-muted uppercase tracking-wider truncate">{kpi.name}</span>
                  <span className="text-3xl font-extrabold text-brand-text">{kpi.value}</span>
                  <span className="text-[11px] text-brand-muted truncate">{kpi.desc}</span>
                </div>
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center border flex-shrink-0 ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Section split: Left - Upcoming returns, Right - Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming and Overdue returns list */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col justify-between">
            <div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Asset Allocation Queue</CardTitle>
                    <CardDescription>Upcoming expected return dispatches requiring check-in auditing.</CardDescription>
                  </div>
                  {stats && stats.overdueReturnsCount > 0 && (
                    <Badge variant="priority-critical" className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {stats.overdueReturnsCount} OVERDUE
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              {/* ==============================
                  BACKEND INTEGRATION
                  Section: Asset Allocation Queue List
                  Endpoint: GET /api/dashboard/upcoming-returns
                  Returns: UpcomingReturnItem[]
                  ============================== */}
              <div className="divide-y divide-brand-border">
                {upcomingReturns.length === 0 ? (
                  <div className="p-8 text-center text-xs text-brand-muted">
                    No active allocations found in inventory queue.
                  </div>
                ) : (
                  upcomingReturns.slice(0, 4).map(item => (
                    <div key={item.id} className="px-5 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold
                          ${item.isOverdue ? 'bg-red-50 text-brand-danger border border-red-100' : 'bg-gray-50 text-brand-muted border border-brand-border'}
                        `}>
                          {item.assetTag}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-brand-text truncate">{item.name}</span>
                          <span className="text-[11px] text-brand-muted truncate flex items-center gap-1">
                            <UserCheck className="h-3 w-3 text-brand-secondary flex-shrink-0" />
                            Assigned to: {item.holderName}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-xs font-mono font-semibold
                          ${item.isOverdue ? 'text-brand-danger' : 'text-brand-muted'}
                        `}>
                          Due: {new Date(item.expectedReturnDate).toLocaleDateString()}
                        </span>
                        <Badge variant={item.isOverdue ? 'status-lost' : 'status-allocated'}>
                          {item.isOverdue ? 'Overdue Return' : 'In Possession'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <CardFooter>
              <span className="text-xs text-brand-muted font-medium">Monitoring return compliance policies.</span>
              <Button variant="ghost" size="sm" className="text-xs font-bold text-brand-primary cursor-pointer flex items-center gap-0.5">
                Manage Allocations
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Live Timeline Audit Logs Feed */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle>System Activity Timeline</CardTitle>
                <CardDescription>Live streaming audit logs tracking organizational lifecycle changes.</CardDescription>
              </CardHeader>

              {/* ==============================
                  BACKEND INTEGRATION
                  Section: Activity Timeline List
                  Endpoint: GET /api/dashboard/timeline?limit=6
                  Returns: AssetHistory[]
                  ============================== */}
              <div className="px-5 py-4 space-y-4">
                {timeline.length === 0 ? (
                  <div className="p-8 text-center text-xs text-brand-muted">
                    No recent events logged.
                  </div>
                ) : (
                  timeline.slice(0, 4).map((item, idx) => (
                    <div key={item.id} className="flex gap-3 text-xs">
                      <div className="flex flex-col items-center">
                        <div className={`h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0 
                          ${item.type === 'Allocation' ? 'bg-indigo-500' :
                            item.type === 'Transfer' ? 'bg-purple-500' :
                            item.type === 'Maintenance' ? 'bg-orange-500' : 'bg-emerald-500'}
                        `} />
                        {idx !== timeline.slice(0, 4).length - 1 && (
                          <div className="w-0.5 h-12 bg-brand-border my-1 flex-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <span className="font-semibold text-brand-text truncate">{item.title}</span>
                        <p className="text-brand-muted leading-tight text-[11px]">{item.description}</p>
                        <span className="text-[10px] text-brand-muted mt-1">{new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <CardFooter>
              <span className="text-xs text-brand-muted font-medium">Compliance-safe historical log.</span>
              <Button variant="ghost" size="sm" className="text-xs font-bold text-brand-primary cursor-pointer flex items-center gap-0.5">
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
