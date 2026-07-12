import * as React from 'react';
import { Building2, Layers, Users, UserCog, Plus, ShieldCheck, Mail, Sliders } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { assetService } from '../services/asset.service';
import { authService } from '../services/auth.service';
import { Department, AssetCategory, Employee, UserRole } from '../types';
import toast from 'react-hot-toast';

// ==============================
// BACKEND INTEGRATION
// Page: Organization Setup (Administrative Settings)
//
// API Endpoints Required:
// 1. GET /api/departments
//    - Authentication: JWT Required
//    - Response: Department[]
// 
// 2. POST /api/departments
//    - Authentication: JWT Required (Admin Only)
//    - Request Body: { name: string, headId?: string, status: string }
//    - Response: Department
// 
// 3. GET /api/categories
//    - Authentication: JWT Required
//    - Response: AssetCategory[]
// 
// 4. POST /api/categories
//    - Authentication: JWT Required (Admin/Manager Only)
//    - Request Body: { name: string, description: string }
//    - Response: AssetCategory
// 
// 5. GET /api/employees
//    - Authentication: JWT Required
//    - Response: Employee[]
// 
// 6. PUT /api/employees/:id/role
//    - Authentication: JWT Required (Admin Only)
//    - Request Body: { role: UserRole }
//    - Response: Employee
//
// Error Handling:
// - Standard 401: Unauthorized (Redirect to login)
// - Standard 403: Forbidden (If non-admin attempts writes)
// - Standard 400: Bad Request (Validation errors)
// ==============================

export const OrganizationSetup: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'departments' | 'categories' | 'employees'>('departments');

  // TODO(BACKEND):
  // Replace with API response from GET /api/departments
  const [departments, setDepartments] = React.useState<Department[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/categories
  const [categories, setCategories] = React.useState<AssetCategory[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/employees
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

  // BACKEND API
  // Method: POST
  // Endpoint: /api/departments
  // Authentication: JWT Required (Admin Only)
  // Request DTO: { name: string, headId?: string, status: string }
  // Response DTO: Department
  // Expected Status Codes: 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden
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

  // BACKEND API
  // Method: POST
  // Endpoint: /api/categories
  // Authentication: JWT Required (Admin/Manager Only)
  // Request DTO: { name: string, description: string }
  // Response DTO: AssetCategory
  // Expected Status Codes: 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden
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

  // BACKEND API
  // Method: PUT
  // Endpoint: /api/employees/:id/role
  // Authentication: JWT Required (Admin Only)
  // Request DTO: { role: UserRole }
  // Response DTO: Employee
  // Expected Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found
  const handleUpdateRole = async () => {
    if (!editingEmployee) return;

    try {
      const admin = employees.find(e => e.role === 'Admin'); // Mock admin actor
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
    return <div className="text-center py-20 text-xs text-brand-muted font-bold uppercase tracking-wider">Retrieving master data panels...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-text">Organization Setup</h1>
        <p className="text-xs text-brand-muted">Configure your corporate hierarchy, register inventory classes, and regulate access roles.</p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-brand-border gap-2">
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5
            ${activeTab === 'departments' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-muted hover:text-brand-text'}
          `}
        >
          <Building2 className="h-4 w-4" />
          Departments ({departments.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5
            ${activeTab === 'categories' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-muted hover:text-brand-text'}
          `}
        >
          <Layers className="h-4 w-4" />
          Asset Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5
            ${activeTab === 'employees' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-muted hover:text-brand-text'}
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
              <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Registered Corporate Departments</span>
              <Button size="sm" onClick={() => setShowDeptModal(true)} className="cursor-pointer">
                <Plus className="h-4 w-4 mr-1" />
                Add Department
              </Button>
            </div>

            {/* Dept Creation Modal Mock Inline */}
            {showDeptModal && (
              <Card className="border-brand-primary/20 bg-brand-primary/5 animate-slide-down">
                <CardHeader>
                  <CardTitle className="text-xs">Create New Organization Department</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  {/* TODO(BACKEND): Handle Form Submission for Department Registration */}
                  <form onSubmit={handleCreateDept} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <Input
                      label="Department Name"
                      placeholder="e.g. Sales & Account Management"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      required
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-brand-text/80 uppercase tracking-wider">Assign Head</label>
                      <select 
                        className="w-full px-3.5 py-2 text-sm bg-white border border-brand-border rounded-lg outline-none focus:border-brand-primary"
                        value={newDeptHead}
                        onChange={(e) => setNewDeptHead(e.target.value)}
                      >
                        <option value="">Select Department Head...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" variant="primary" className="flex-1 cursor-pointer">Record</Button>
                      <Button variant="outline" onClick={() => setShowDeptModal(false)} className="cursor-pointer">Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ==============================
                BACKEND INTEGRATION
                Grid Render: Departments list
                Endpoint: GET /api/departments
                Returns: Department[]
                ============================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map(dept => (
                <Card key={dept.id} className="hover-lift">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-brand-text">{dept.name}</span>
                        <span className="text-[11px] font-mono text-brand-muted">{dept.id}</span>
                      </div>
                      <Badge variant={dept.status === 'Active' ? 'status-available' : 'status-retired'}>
                        {dept.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-brand-border pt-3 mt-1">
                      <span className="text-brand-muted">Department Head:</span>
                      <span className="font-bold text-brand-text">{getHeadName(dept.headId)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Asset Classes & Templates</span>
              <Button size="sm" onClick={() => setShowCatModal(true)} className="cursor-pointer">
                <Plus className="h-4 w-4 mr-1" />
                Add Category
              </Button>
            </div>

            {showCatModal && (
              <Card className="border-brand-primary/20 bg-brand-primary/5 animate-slide-down">
                <CardHeader>
                  <CardTitle className="text-xs">Add Asset Classification Class</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  {/* TODO(BACKEND): Handle Form Submission for Asset Class registration */}
                  <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <Input
                      label="Category Name"
                      placeholder="e.g. Tools & Industrial"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      required
                    />
                    <Input
                      label="Short Description"
                      placeholder="Power drills, diagnostic gauges, safety devices"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      required
                    />
                    <div className="flex gap-2">
                      <Button type="submit" variant="primary" className="flex-1 cursor-pointer">Create</Button>
                      <Button variant="outline" onClick={() => setShowCatModal(false)} className="cursor-pointer">Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ==============================
                BACKEND INTEGRATION
                Grid Render: Asset Categories list
                Endpoint: GET /api/categories
                Returns: AssetCategory[]
                ============================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(cat => (
                <Card key={cat.id} className="hover-lift">
                  <CardContent className="p-5 flex flex-col gap-2">
                    <span className="text-sm font-bold text-brand-text uppercase tracking-wide">{cat.name}</span>
                    <p className="text-xs text-brand-muted leading-relaxed">{cat.description}</p>
                    {cat.customFields && cat.customFields.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 border-t border-brand-border pt-3">
                        {cat.customFields.map((f, i) => (
                          <Badge key={i} variant="primary" className="text-[10px]">
                            {f.name} ({f.type})
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Access Roles & Promotions Control</span>

            {/* Inline Promotion Editor Mock */}
            {editingEmployee && (
              <Card className="border-brand-secondary/30 bg-brand-secondary/5 animate-slide-down">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={editingEmployee.avatarUrl} className="h-10 w-10 rounded-full object-cover" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-brand-text">{editingEmployee.name}</span>
                      <span className="text-[11px] text-brand-muted">{editingEmployee.email}</span>
                    </div>
                  </div>
                  {/* TODO(BACKEND): Handle Employee Promotion and Role update action */}
                  <div className="flex items-center gap-3">
                    <select
                      className="px-3 py-1.5 text-xs bg-white border border-brand-border rounded-lg focus:border-brand-secondary outline-none font-semibold"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                    >
                      <option value="Employee">Employee (Read/Book Only)</option>
                      <option value="Department Head">Department Head</option>
                      <option value="Asset Manager">Asset Manager (Allocations/Repairs)</option>
                      <option value="Admin">Admin (Full Master Access)</option>
                    </select>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="secondary" onClick={handleUpdateRole} className="cursor-pointer">Apply</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingEmployee(null)} className="cursor-pointer">Cancel</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ==============================
                BACKEND INTEGRATION
                Table Render: Employee Directory Ledger
                Endpoint: GET /api/employees
                Returns: Employee[]
                ============================== */}
            <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-brand-border">
                <thead className="bg-gray-50 font-bold text-brand-muted uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Name / Email</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Access Role</th>
                    <th className="px-6 py-3.5">System Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-brand-text">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3.5 flex items-center gap-3">
                        <img src={emp.avatarUrl} className="h-8 w-8 rounded-full object-cover border border-brand-border" referrerPolicy="no-referrer" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold truncate">{emp.name}</span>
                          <span className="text-brand-muted text-[11px] truncate">{emp.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-medium">
                        {departments.find(d => d.id === emp.departmentId)?.name || 'Internal Guest'}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge variant={emp.role === 'Admin' ? 'primary' : emp.role === 'Asset Manager' ? 'secondary' : emp.role === 'Department Head' ? 'success' : 'muted'}>
                          {emp.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 font-semibold ${emp.status === 'Active' ? 'text-brand-success' : 'text-brand-muted'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${emp.status === 'Active' ? 'bg-brand-success' : 'bg-brand-muted'}`} />
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {/* TODO(BACKEND): Adjust Role Action Button */}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingEmployee(emp);
                            setNewRole(emp.role);
                          }}
                          className="text-xs text-brand-secondary font-bold cursor-pointer hover:bg-brand-secondary/5"
                        >
                          <UserCog className="h-3.5 w-3.5 mr-1" />
                          Adjust Role
                        </Button>
                      </td>
                    </tr>
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
