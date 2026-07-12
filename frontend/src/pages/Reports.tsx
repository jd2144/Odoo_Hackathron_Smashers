import * as React from 'react';
import { FileBarChart, Download, Calendar, Filter, Share2, Printer, CheckSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  reportService, 
  UtilizationData, 
  MaintenanceFrequencyData, 
  DepartmentAllocationData, 
  BookingHeatmapData 
} from '../services/report.service';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import toast from 'react-hot-toast';

// ==============================
// BACKEND INTEGRATION
// Page: Reports & Analytics
//
// API Endpoints Required:
// 1. GET /api/reports/utilization
//    - Authentication: JWT Required
//    - Response: UtilizationData[]
// 
// 2. GET /api/reports/maintenance-frequency
//    - Authentication: JWT Required
//    - Response: MaintenanceFrequencyData[]
// 
// 3. GET /api/reports/department-allocation
//    - Authentication: JWT Required
//    - Response: DepartmentAllocationData[]
// 
// 4. GET /api/reports/booking-heatmap
//    - Authentication: JWT Required
//    - Response: BookingHeatmapData[]
// 
// 5. GET /api/reports/retirement-forecast
//    - Authentication: JWT Required
//    - Response: any[] (Nearing retirement assets)
//
// 6. GET /api/reports/export?format=PDF|CSV
//    - Authentication: JWT Required
//    - Returns: Binary file stream (PDF/CSV)
//
// Error Handling:
// - Standard 401: Unauthorized (Redirect to login)
// - Standard 500: Display toast message "Failed to load analytical visual report streams."
// ==============================

export const Reports: React.FC = () => {
  // TODO(BACKEND):
  // Replace with API response from GET /api/reports/utilization
  const [utilization, setUtilization] = React.useState<UtilizationData[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/reports/maintenance-frequency
  const [maintenance, setMaintenance] = React.useState<MaintenanceFrequencyData[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/reports/department-allocation
  const [allocation, setAllocation] = React.useState<DepartmentAllocationData[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/reports/booking-heatmap
  const [heatmap, setHeatmap] = React.useState<BookingHeatmapData[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/reports/retirement-forecast
  const [retirement, setRetirement] = React.useState<any[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);
      try {
        const [utilData, maintData, allocData, heatData, retireData] = await Promise.all([
          reportService.getAssetUtilization(),
          reportService.getMaintenanceFrequency(),
          reportService.getDepartmentAllocation(),
          reportService.getBookingHeatmap(),
          reportService.getRetirementForecast()
        ]);
        setUtilization(utilData);
        setMaintenance(maintData);
        setAllocation(allocData);
        setHeatmap(heatData);
        setRetirement(retireData);
      } catch (e) {
        toast.error('Failed to load analytical visual report streams.');
      } finally {
        setIsLoading(false);
      }
    };

    loadReportData();
  }, []);

  // BACKEND API
  // Method: GET
  // Endpoint: /api/reports/export?format=:format
  // Authentication: JWT Required
  // Expected Response: Binary PDF/CSV file download
  const handleExport = (format: string) => {
    toast.success(`Generated operational export in ${format} format!`);
  };

  if (isLoading) {
    return <div className="text-center py-20 text-xs font-bold text-brand-muted uppercase tracking-wider">Compiling analytical data points...</div>;
  }

  // Theme Colors
  const COLORS = ['#5B5FEF', '#7B61FF', '#10B981', '#F59E0B', '#EF4444', '#64748B'];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">Reports & Analytics</h1>
          <p className="text-xs text-brand-muted">Measure asset utility rates, corporate fleet mileage expenses, and forecast hardware retirements.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* TODO(BACKEND): PDF Export button */}
          <Button variant="outline" size="sm" onClick={() => handleExport('PDF')} className="cursor-pointer">
            <Printer className="h-4 w-4 mr-1.5" />
            PDF Brief
          </Button>
          {/* TODO(BACKEND): CSV Export button */}
          <Button variant="primary" size="sm" onClick={() => handleExport('CSV')} className="cursor-pointer font-bold">
            <Download className="h-4 w-4 mr-1.5" />
            CSV Data Sheet
          </Button>
        </div>
      </div>

      {/* Grid: 2x2 Bento Cards Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Utilization Chart */}
        {/* ==============================
            BACKEND INTEGRATION
            Visual Chart: Asset Group Utilization Rates
            Endpoint: GET /api/reports/utilization
            Returns: UtilizationData[]
            ============================== */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Asset Group Utilization Rates</CardTitle>
            <CardDescription>Visual comparison of Allocated vs Available hardware counts across departments.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilization} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="category" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="allocated" name="Allocated" fill="#5B5FEF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="available" name="Available" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maintenance" name="Under Repair" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Financial Distribution Pie Chart */}
        {/* ==============================
            BACKEND INTEGRATION
            Visual Chart: Departmental Asset Valuation
            Endpoint: GET /api/reports/department-allocation
            Returns: DepartmentAllocationData[]
            ============================== */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Departmental Asset Valuation</CardTitle>
            <CardDescription>Value shares measured in $USD aggregated across corporate sub-departments.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 p-5 flex items-center justify-center">
            <div className="w-full h-full flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="totalValue"
                      nameKey="departmentName"
                    >
                      {allocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-1/2 text-xs">
                {allocation.map((entry, index) => (
                  <div key={entry.departmentName} className="flex items-center justify-between border-b pb-1.5 border-brand-border/40">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-semibold text-brand-text truncate max-w-[120px]">{entry.departmentName}</span>
                    </div>
                    <span className="text-brand-muted font-mono">${entry.totalValue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Heatmap line chart */}
        {/* ==============================
            BACKEND INTEGRATION
            Visual Chart: Booking Heatmap Peak Hours
            Endpoint: GET /api/reports/booking-heatmap
            Returns: BookingHeatmapData[]
            ============================== */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Booking Heatmap Peak Hours</CardTitle>
            <CardDescription>Hour distributions of conference rooms and car keys usage.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={heatmap} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="10:00 - 12:00" name="Late Morning slots (Peak)" stroke="#7B61FF" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="14:00 - 16:00" name="Mid Afternoon slots" stroke="#5B5FEF" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Retirement Table Lists */}
        {/* ==============================
            BACKEND INTEGRATION
            List Render: Hardware Retirement Forecasts
            Endpoint: GET /api/reports/retirement-forecast
            Returns: any[]
            ============================== */}
        <Card className="bg-white flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle>Hardware Retirement Forecasts</CardTitle>
              <CardDescription>Hardware nearing end-of-lifecycle due to wear, cosmetic damage, or age.</CardDescription>
            </CardHeader>
            <div className="divide-y divide-brand-border px-5 py-2">
              {retirement.length === 0 ? (
                <div className="py-12 text-center text-xs text-brand-muted">
                  No assets forecasted for retirement.
                </div>
              ) : (
                retirement.slice(0, 3).map(item => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <strong className="text-brand-text font-bold">{item.name}</strong>
                      <span className="text-[10px] text-brand-muted font-mono">{item.assetTag} | Category: {item.category}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="status-maintenance">{item.condition} Wear</Badge>
                      <span className="text-[10px] font-mono font-bold text-brand-muted">Retire: {item.estimatedRetirementYear}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <CardFooter>
            <span className="text-[11px] text-brand-muted">Planning replacement budget allocations.</span>
            <Button variant="ghost" size="sm" className="text-xs font-semibold text-brand-primary cursor-pointer flex items-center gap-0.5" onClick={() => handleExport('Retirement Forecast Sheet')}>
              Full Ledger List
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
};
export default Reports;
