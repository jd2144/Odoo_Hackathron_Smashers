import * as React from 'react';
import { motion } from 'motion/react';
import { Download, Printer } from 'lucide-react';
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

export const Reports: React.FC = () => {
  const [utilization, setUtilization] = React.useState<UtilizationData[]>([]);
  const [, setMaintenance] = React.useState<MaintenanceFrequencyData[]>([]);
  const [allocation, setAllocation] = React.useState<DepartmentAllocationData[]>([]);
  const [heatmap, setHeatmap] = React.useState<BookingHeatmapData[]>([]);
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

  const handleExport = (format: string) => {
    toast.success(`Generated operational export in ${format} format!`);
  };

  if (isLoading) {
    return (
      <div className="text-center py-24 text-[10px] font-black text-sahara-gold uppercase tracking-widest">
        Compiling analytical data points...
      </div>
    );
  }

  // Sahara Desert × Silk Color Palette for Recharts
  // Warm Gold, Primary Sand, Terracotta, Accent Olive, Clay Brown, Desert Beige
  const COLORS = ['#C98C3A', '#D4A373', '#B5654A', '#7A8450', '#7F5539', '#E9D8A6'];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-sahara-coffee">Reports & Analytics</h1>
          <p className="text-xs text-sahara-clay/70 font-semibold leading-relaxed">Measure asset utility rates, corporate fleet mileage expenses, and forecast hardware retirements.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => handleExport('PDF')} className="cursor-pointer rounded-xl font-bold text-xs uppercase tracking-wider py-2.5 px-4">
            <Printer className="h-4 w-4 mr-1.5" />
            PDF Brief
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleExport('CSV')} className="cursor-pointer font-extrabold text-xs uppercase tracking-wider rounded-xl py-2.5 px-4 shadow-md">
            <Download className="h-4 w-4 mr-1.5" />
            CSV Data Sheet
          </Button>
        </div>
      </div>

      {/* Grid: 2x2 Bento Cards Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Utilization Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-white/80 backdrop-blur-md shadow-md">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-sahara-coffee">Asset Group Utilization Rates</CardTitle>
              <CardDescription className="text-sahara-clay/70 font-semibold">Visual comparison of Allocated vs Available hardware counts.</CardDescription>
            </CardHeader>
            <CardContent className="h-80 p-5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilization} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAF3E0" />
                  <XAxis dataKey="category" stroke="#7F5539" fontSize={10} tickLine={false} />
                  <YAxis stroke="#7F5539" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #FAF3E0', backgroundColor: '#FFF8F0', color: '#4E342E' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                  <Bar dataKey="allocated" name="Allocated" fill="#C98C3A" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="available" name="Available" fill="#D4A373" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="maintenance" name="Under Repair" fill="#B5654A" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Financial Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="bg-white/80 backdrop-blur-md shadow-md">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-sahara-coffee">Departmental Asset Valuation</CardTitle>
              <CardDescription className="text-sahara-clay/70 font-semibold">Value shares measured in $USD aggregated across corporate sub-departments.</CardDescription>
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
                <div className="flex flex-col gap-2.5 w-full sm:w-1/2 text-[11px] font-semibold text-sahara-clay">
                  {allocation.map((entry, index) => (
                    <div key={entry.departmentName} className="flex items-center justify-between border-b pb-2 border-sahara-sand/15">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="font-extrabold text-sahara-coffee truncate max-w-[120px]">{entry.departmentName}</span>
                      </div>
                      <span className="text-sahara-gold font-mono font-bold">${entry.totalValue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Heatmap line chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/80 backdrop-blur-md shadow-md">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-sahara-coffee">Booking Heatmap Peak Hours</CardTitle>
              <CardDescription className="text-sahara-clay/70 font-semibold">Hour distributions of shared team resources and vehicle requests.</CardDescription>
            </CardHeader>
            <CardContent className="h-80 p-5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={heatmap} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAF3E0" />
                  <XAxis dataKey="day" stroke="#7F5539" fontSize={10} tickLine={false} />
                  <YAxis stroke="#7F5539" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #FAF3E0', backgroundColor: '#FFF8F0', color: '#4E342E' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="10:00 - 12:00" name="Morning slots (Peak)" stroke="#C98C3A" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="14:00 - 16:00" name="Mid Afternoon slots" stroke="#B5654A" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Retirement Table Lists */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="h-full"
        >
          <Card className="bg-white/80 backdrop-blur-md shadow-md flex flex-col justify-between h-full">
            <div>
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-wider text-sahara-coffee">Hardware Retirement Forecasts</CardTitle>
                <CardDescription className="text-sahara-clay/70 font-semibold">Hardware nearing end-of-lifecycle due to operational wear and age.</CardDescription>
              </CardHeader>
              <div className="divide-y divide-sahara-sand/10 px-6 py-2">
                {retirement.length === 0 ? (
                  <div className="py-12 text-center text-xs text-sahara-clay/50 font-bold uppercase tracking-wider">
                    No assets forecasted for retirement.
                  </div>
                ) : (
                  retirement.slice(0, 3).map(item => (
                    <div key={item.id} className="py-3.5 flex items-center justify-between text-xs font-semibold">
                      <div className="flex flex-col gap-0.5">
                        <strong className="text-sahara-coffee font-extrabold">{item.name}</strong>
                        <span className="text-[10px] text-sahara-clay/60 font-mono">{item.assetTag} | Category: {item.category}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge variant="status-maintenance" className="font-extrabold py-0.5 text-[9px]">{item.condition} Wear</Badge>
                        <span className="text-[10px] font-mono font-bold text-sahara-gold">Retire: {item.estimatedRetirementYear}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <CardFooter className="flex items-center justify-between border-t border-sahara-sand/10 px-6 py-4.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sahara-clay/50">Budget Allocation Sheet</span>
              <Button variant="ghost" size="sm" className="text-xs font-black uppercase tracking-widest text-sahara-gold hover:text-sahara-coffee cursor-pointer flex items-center gap-0.5" onClick={() => handleExport('Retirement Forecast Sheet')}>
                Full Ledger List
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

      </div>
    </div>
  );
};
export default Reports;
