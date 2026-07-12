import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Layers, Users, UserCog, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { assetService } from '../services/asset.service';
import { authService } from '../services/auth.service';
import { Department, AssetCategory, Employee, UserRole } from '../types';
import toast from 'react-hot-toast';

export const OrganizationSetup: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'departments' | 'categories' | 'employees'>('departments');

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [categories, setCategories] = React.useState<AssetCategory[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // New item form states
  const [showDeptModal, setShowDeptModal] = React.useState(false);
  const [newDeptName, setNewDeptName] = React.useState('');
  const [newDeptHead, setNewDeptHead] = React.useState('');
  
  const [showCatModal, setShowCatModal] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState('');
  const [newCatDesc, setNewCatDesc] = React.useState('');

  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [newRole, setNewRole] = React.useState<UserRole>('Employee');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [depts, cats, emps] = await Promise.all([
        assetService.getDepartments(),
        assetService.getCategories(),
        assetService.getEmployees()
      ]);
      setDepartments(depts);
      setCategories(cats);
      setEmployees(emps);
    } catch (e) {
      toast.error('Failed to load administrative master records.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      await assetService.createDepartment({
        name: newDeptName,
        headId: newDeptHead || undefined,
        status: 'Active'
      });
      toast.success('New department successfully recorded.');
      setNewDeptName('');
      setNewDeptHead('');
      setShowDeptModal(false);
      loadData();
    } catch (error) {
      toast.error('Failed to create department.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await assetService.createCategory({
        name: newCatName,
        description: newCatDesc
      });
      toast.success('Asset category registered.');
      setNewCatName('');
      setNewCatDesc('');
      setShowCatModal(false);
      loadData();
    } catch (error) {
      toast.error('Failed to register category.');
    }
  };

  const handleUpdateRole = async () => {
    if (!editingEmployee) return;

    try {
      const admin = employees.find(e => e.role === 'Admin');
      if (admin) {
        await authService.promoteEmployee(admin.id, editingEmployee.id, newRole);
        toast.success(`Role updated successfully for ${editingEmployee.name}`);
        setEditingEmployee(null);
        loadData();
      }
    } catch (error: any) {
      toast.error(error.message || 'Promotion failed.');
    }
  };

  const getHeadName = (headId?: string) => {
    if (!headId) return 'Unassigned';
    const emp = employees.find(e => e.id === headId);
    return emp ? emp.name : 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="text-center py-24 text-[10px] font-black text-sahara-gold uppercase tracking-widest">
        Retrieving master data panels...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-sahara-coffee">Organization Setup</h1>
        <p className="text-xs text-sahara-clay/70 font-semibold leading-relaxed">Configure your corporate hierarchy, register inventory classes, and regulate access roles.</p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-sahara-sand/15 gap-2">
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2
            ${activeTab === 'departments' ? 'border-sahara-gold text-sahara-gold' : 'border-transparent text-sahara-clay/65 hover:text-sahara-coffee'}
          `}
        >
          <Building2 className="h-4 w-4" />
          Departments ({departments.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2
            ${activeTab === 'categories' ? 'border-sahara-gold text-sahara-gold' : 'border-transparent text-sahara-clay/65 hover:text-sahara-coffee'}
          `}
        >
          <Layers className="h-4 w-4" />
          Asset Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2
            ${activeTab === 'employees' ? 'border-sahara-gold text-sahara-gold' : 'border-transparent text-sahara-clay/65 hover:text-sahara-coffee'}
          `}
        >
          <Users className="h-4 w-4" />
          Employee Directory ({employees.length})
        </button>
      </div>

      {/* Panel Render */}
      <div>
        {activeTab === 'departments' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-sahara-clay/60 uppercase tracking-widest pl-0.5">Registered Corporate Departments</span>
              <Button size="sm" onClick={() => setShowDeptModal(true)} className="cursor-pointer rounded-xl text-xs uppercase tracking-wider font-bold">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Department
              </Button>
            </div>

            {/* Dept Creation Modal */}
            {showDeptModal && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -15 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                className="overflow-hidden"
              >
                <Card className="border-sahara-sand/35 bg-sahara-light/20 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-[10px]">Create New Organization Department</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleCreateDept} className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
                      <Input
                        label="Department Name"
                        placeholder="e.g. Sales & Account Management"
                        value={newDeptName}
                        className="bg-white/60"
                        onChange={(e) => setNewDeptName(e.target.value)}
                        required
                      />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-sahara-clay/90 uppercase tracking-widest pl-0.5">Assign Head</label>
                        <select 
                          className="w-full px-4 py-2.5 text-sm bg-white/60 border border-sahara-sand/35 rounded-xl outline-none focus:border-sahara-gold focus:ring-4 focus:ring-sahara-gold/10 text-sahara-coffee font-semibold cursor-pointer transition-all"
                          value={newDeptHead}
                          onChange={(e) => setNewDeptHead(e.target.value)}
                        >
                          <option value="">Select Department Head...</option>
                          {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" variant="primary" className="flex-1 cursor-pointer text-xs uppercase font-extrabold tracking-wider py-3 rounded-xl">Record</Button>
                        <Button variant="outline" onClick={() => setShowDeptModal(false)} className="flex-1 cursor-pointer text-xs uppercase font-bold py-3 rounded-xl text-sahara-clay hover:text-sahara-coffee">Cancel</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((dept, index) => (
                <motion.div
                  key={dept.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="silk-card bg-white/80 hover:border-sahara-gold/30 shadow-sm border-l-4 border-l-sahara-gold">
                    <CardContent className="p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-extrabold text-sahara-coffee">{dept.name}</span>
                          <span className="text-[9px] font-mono font-black text-sahara-clay/50 uppercase tracking-wider">{dept.id}</span>
                        </div>
                        <Badge variant={dept.status === 'Active' ? 'status-available' : 'status-retired'} className="font-extrabold text-[9px]">
                          {dept.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs border-t border-sahara-sand/10 pt-3 mt-1 font-semibold">
                        <span className="text-sahara-clay/75">Department Head:</span>
                        <span className="font-extrabold text-sahara-coffee">{getHeadName(dept.headId)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-sahara-clay/60 uppercase tracking-widest pl-0.5">Asset Classes & Templates</span>
              <Button size="sm" onClick={() => setShowCatModal(true)} className="cursor-pointer rounded-xl text-xs uppercase tracking-wider font-bold">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Category
              </Button>
            </div>

            {showCatModal && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -15 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                className="overflow-hidden"
              >
                <Card className="border-sahara-sand/35 bg-sahara-light/20 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-[10px]">Add Asset Classification Class</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
                      <Input
                        label="Category Name"
                        placeholder="e.g. Tools & Industrial"
                        value={newCatName}
                        className="bg-white/60"
                        onChange={(e) => setNewCatName(e.target.value)}
                        required
                      />
                      <Input
                        label="Short Description"
                        placeholder="Power drills, diagnostic gauges, safety devices"
                        value={newCatDesc}
                        className="bg-white/60"
                        onChange={(e) => setNewCatDesc(e.target.value)}
                        required
                      />
                      <div className="flex gap-2">
                        <Button type="submit" variant="primary" className="flex-1 cursor-pointer text-xs uppercase font-extrabold tracking-wider py-3 rounded-xl">Create</Button>
                        <Button variant="outline" onClick={() => setShowCatModal(false)} className="flex-1 cursor-pointer text-xs uppercase font-bold py-3 rounded-xl text-sahara-clay hover:text-sahara-coffee">Cancel</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat, index) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="silk-card bg-white/80 hover:border-sahara-gold/30 shadow-sm border-l-4 border-l-sahara-sand/30">
                    <CardContent className="p-5 flex flex-col gap-2.5">
                      <span className="text-sm font-extrabold text-sahara-coffee uppercase tracking-wide">{cat.name}</span>
                      <p className="text-xs text-sahara-clay/80 font-medium leading-relaxed italic">"{cat.description}"</p>
                      {cat.customFields && cat.customFields.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 border-t border-sahara-sand/10 pt-3">
                          {cat.customFields.map((f, i) => (
                            <Badge key={i} variant="primary" className="text-[10px] font-extrabold">
                              {f.name} ({f.type})
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-black text-sahara-clay/60 uppercase tracking-widest pl-0.5">Access Roles & Promotions Control</span>

            {/* Inline Promotion Editor */}
            <AnimatePresence>
              {editingEmployee && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="overflow-hidden"
                >
                  <Card className="border-sahara-gold/25 bg-sahara-light/20 shadow-md">
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <img src={editingEmployee.avatarUrl} className="h-10 w-10 rounded-xl object-cover border border-sahara-sand/15" />
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-sahara-coffee">{editingEmployee.name}</span>
                          <span className="text-[11px] text-sahara-clay/85 font-semibold">{editingEmployee.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          className="px-3.5 py-2 text-xs bg-white border border-sahara-sand/25 rounded-xl focus:border-sahara-gold outline-none font-bold text-sahara-coffee cursor-pointer transition-all"
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as UserRole)}
                        >
                          <option value="Employee">Employee (Read/Book Only)</option>
                          <option value="Department Head">Department Head</option>
                          <option value="Asset Manager">Asset Manager (Allocations/Repairs)</option>
                          <option value="Admin">Admin (Full Master Access)</option>
                        </select>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={handleUpdateRole} className="cursor-pointer font-black uppercase text-[10px] tracking-wider py-2 rounded-xl">Apply</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingEmployee(null)} className="cursor-pointer font-bold text-xs py-2 rounded-xl text-sahara-clay hover:text-sahara-coffee">Cancel</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Employee Directory Table */}
            <div className="bg-white/85 backdrop-blur-md border border-sahara-sand/15 rounded-2xl shadow-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-sahara-sand/10 min-w-[700px]">
                <thead className="bg-sahara-light/30 font-bold text-sahara-clay uppercase tracking-widest text-[9px] border-b border-sahara-sand/15">
                  <tr>
                    <th className="px-6 py-4.5">Name / Email</th>
                    <th className="px-6 py-4.5">Department</th>
                    <th className="px-6 py-4.5">Access Role</th>
                    <th className="px-6 py-4.5">System Status</th>
                    <th className="px-6 py-4.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sahara-sand/10 text-sahara-coffee font-semibold">
                  {employees.map((emp, index) => (
                    <motion.tr 
                      key={emp.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.01 }}
                      className="luxury-table-row hover:bg-sahara-sand/5"
                    >
                      <td className="px-6 py-3.5 flex items-center gap-3.5">
                        <img src={emp.avatarUrl} className="h-8.5 w-8.5 rounded-xl object-cover border border-sahara-sand/15 shadow-xs" referrerPolicy="no-referrer" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-extrabold truncate">{emp.name}</span>
                          <span className="text-sahara-clay/65 text-[11px] font-medium truncate">{emp.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-sahara-clay">
                        {departments.find(d => d.id === emp.departmentId)?.name || 'Internal Guest'}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge variant={emp.role === 'Admin' ? 'primary' : emp.role === 'Asset Manager' ? 'secondary' : emp.role === 'Department Head' ? 'success' : 'muted'} className="font-extrabold">
                          {emp.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 font-black uppercase text-[10px] tracking-wider ${emp.status === 'Active' ? 'text-emerald-700' : 'text-sahara-clay/60'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500' : 'bg-sahara-clay/30'}`} />
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingEmployee(emp);
                            setNewRole(emp.role);
                          }}
                          className="text-[10px] text-sahara-gold font-black uppercase tracking-wider cursor-pointer hover:bg-sahara-sand/5"
                        >
                          <UserCog className="h-3.5 w-3.5 mr-1 text-sahara-gold" />
                          Adjust Role
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default OrganizationSetup;
