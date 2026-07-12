import * as React from 'react';
import { Package, Search, LayoutGrid, List, Plus, QrCode, ClipboardCopy, MapPin, Tag, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { assetService, AssetFilterOptions } from '../services/asset.service';
import { Asset, AssetCategory } from '../types';
import toast from 'react-hot-toast';

// ==============================
// BACKEND INTEGRATION
// Page: Asset Directory Management Console
//
// API Endpoints Required:
// 1. GET /api/assets (With optional query params: search, categoryId, status)
//    - Authentication: JWT Required
//    - Response: Asset[]
// 
// 2. GET /api/categories
//    - Authentication: JWT Required
//    - Response: AssetCategory[]
// 
// 3. POST /api/assets
//    - Authentication: JWT Required (Admin/Manager Only)
//    - Request Body: { name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition, location, sharedBookable, status }
//    - Response: Asset
// 
// 4. GET /api/assets/:id/qr
//    - Authentication: JWT Required
//    - Response: { qrCodeUrl: string } (or returns file stream)
//
// Error Handling:
// - Standard 401: Unauthorized (Redirect to login)
// - Standard 403: Forbidden (Unauthorized read/write attempts)
// - Standard 422: Unprocessable Entity (Missing required register parameters or duplicate assetTag/SN codes)
// ==============================

export const AssetManagement: React.FC = () => {
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');

  // TODO(BACKEND):
  // Replace with API response from GET /api/assets
  const [assets, setAssets] = React.useState<Asset[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/categories
  const [categories, setCategories] = React.useState<AssetCategory[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);
  
  // Search / Filter State
  const [search, setSearch] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [status, setStatus] = React.useState<Asset['status'] | ''>('');

  // Asset Creation
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newCat, setNewCat] = React.useState('');
  const [newSerial, setNewSerial] = React.useState('');
  const [newCost, setNewCost] = React.useState('');
  const [newLoc, setNewLoc] = React.useState('');
  const [newBookable, setNewBookable] = React.useState(false);

  // Asset QR Mock Modal
  const [selectedAssetForQr, setSelectedAssetForQr] = React.useState<Asset | null>(null);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const filters: AssetFilterOptions = {};
      if (search) filters.search = search;
      if (categoryId) filters.categoryId = categoryId;
      if (status) filters.status = status;

      const [assetList, catList] = await Promise.all([
        assetService.getAssets(filters),
        assetService.getCategories()
      ]);
      setAssets(assetList);
      setCategories(catList);
    } catch (e) {
      toast.error('Failed to load asset directory items.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAssets();
  }, [search, categoryId, status]);

  // BACKEND API
  // Method: POST
  // Endpoint: /api/assets
  // Authentication: JWT Required (Admin/Manager Only)
  // Request DTO: { name: string, categoryId: string, serialNumber: string, acquisitionDate: string, acquisitionCost: number, condition: string, location: string, sharedBookable: boolean, status: string }
  // Response DTO: Asset
  // Expected Status Codes: 201 Created, 400 Bad Request, 403 Forbidden
  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCat || !newLoc.trim()) {
      toast.error('Please complete all required fields.');
      return;
    }

    try {
      await assetService.registerAsset({
        name: newName,
        categoryId: newCat,
        serialNumber: newSerial || `SN-${Math.random().toString(36).substring(3, 11).toUpperCase()}`,
        acquisitionDate: new Date().toISOString().split('T')[0],
        acquisitionCost: Number(newCost) || 0,
        condition: 'New',
        location: newLoc,
        sharedBookable: newBookable,
        status: 'Available'
      });

      toast.success('Asset successfully logged into registry.');
      // Reset form
      setNewName('');
      setNewCat('');
      setNewSerial('');
      setNewCost('');
      setNewLoc('');
      setNewBookable(false);
      setShowAddForm(false);
      fetchAssets();
    } catch (err) {
      toast.error('Asset registration failed.');
    }
  };

  const copyToClipboard = (tag: string) => {
    navigator.clipboard.writeText(tag);
    toast.success(`Copied asset tag: ${tag}`);
  };

  const getCategoryLabel = (id: string) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : 'Unknown Category';
  };

  const getStatusBadgeVariant = (s: Asset['status']) => {
    switch (s) {
      case 'Available': return 'status-available';
      case 'Allocated': return 'status-allocated';
      case 'Reserved': return 'status-reserved';
      case 'Under Maintenance': return 'status-maintenance';
      case 'Lost': return 'status-lost';
      case 'Retired': return 'status-retired';
      case 'Disposed': return 'status-disposed';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">Asset Directory</h1>
          <p className="text-xs text-brand-muted">Search, audit, and inventory all corporate property. Direct QR printing is available.</p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-1" />
          {showAddForm ? 'Cancel Form' : 'Register New Asset'}
        </Button>
      </div>

      {/* Inline Registration Form */}
      {showAddForm && (
        <Card className="border-brand-primary/20 bg-brand-primary/5 animate-slide-down">
          <CardHeader>
            <CardTitle className="text-xs">Physical Property Logs Sheet</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {/* TODO(BACKEND): Handle Form submission for asset registration */}
            <form onSubmit={handleRegisterAsset} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Input
                label="Asset Name *"
                placeholder="e.g. Dell Monitor 27'"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-brand-text/80 uppercase tracking-wider">Classification Group *</label>
                <select
                  className="w-full px-3.5 py-2 text-sm bg-white border border-brand-border rounded-lg outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  required
                >
                  <option value="">Select Category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Input
                label="Serial Number (Optional)"
                placeholder="System auto-generates if omitted"
                value={newSerial}
                onChange={(e) => setNewSerial(e.target.value)}
              />
              <Input
                type="number"
                label="Acquisition Cost ($USD)"
                placeholder="1200"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
              />
              <Input
                label="Storage/Placement Location *"
                placeholder="e.g. Storage Shelf B12"
                value={newLoc}
                onChange={(e) => setNewLoc(e.target.value)}
                required
              />
              <div className="flex items-center gap-3 h-full sm:pt-6">
                <input
                  type="checkbox"
                  id="bookableCheckbox"
                  className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary border-brand-border"
                  checked={newBookable}
                  onChange={(e) => setNewBookable(e.target.checked)}
                />
                <label htmlFor="bookableCheckbox" className="text-xs font-semibold text-brand-text uppercase tracking-wider cursor-pointer">
                  Shared bookable resource
                </label>
              </div>
              <div className="sm:col-span-2 md:col-span-3 flex justify-end gap-2 border-t border-brand-border pt-4 mt-2">
                <Button type="submit" className="px-6 cursor-pointer">Record to Ledger</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter Row */}
      <Card className="bg-white">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-muted" />
            <input
              type="text"
              placeholder="Filter by name, serial, location..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-brand-background border border-brand-border rounded-lg outline-none focus:border-brand-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
            <select
              className="px-3 py-2 text-xs bg-brand-background border border-brand-border rounded-lg outline-none font-semibold text-brand-text"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              className="px-3 py-2 text-xs bg-brand-background border border-brand-border rounded-lg outline-none font-semibold text-brand-text"
              value={status}
              onChange={(e) => setStatus(e.target.value as Asset['status'] | '')}
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Allocated">Allocated</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Reserved">Reserved</option>
              <option value="Lost">Lost</option>
              <option value="Retired">Retired</option>
            </select>
            
            {/* View Mode Switcher */}
            <div className="flex border border-brand-border rounded-lg p-0.5 bg-brand-background">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white text-brand-primary shadow-xs' : 'text-brand-muted'}`}
                title="Grid representation"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white text-brand-primary shadow-xs' : 'text-brand-muted'}`}
                title="List representation"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Directory Grid/Table Rendering */}
      {isLoading ? (
        <div className="text-center py-20 text-xs font-bold text-brand-muted uppercase tracking-wider">Syncing directory streams...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-brand-border rounded-xl bg-white flex flex-col items-center gap-3">
          <Package className="h-10 w-10 text-brand-muted" />
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">No assets match criteria</span>
          <p className="text-xs text-brand-muted">Adjust search parameters or create a new property record.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ==============================
            BACKEND INTEGRATION
            Grid Render: Asset directory cards
            Endpoint: GET /api/assets
            Returns: Asset[]
            ============================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {assets.map(asset => (
            <Card key={asset.id} className="hover-lift flex flex-col justify-between h-full">
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-brand-border pb-2">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-brand-primary cursor-pointer" onClick={() => copyToClipboard(asset.assetTag)}>
                    <Tag className="h-3 w-3" />
                    {asset.assetTag}
                  </div>
                  <Badge variant={getStatusBadgeVariant(asset.status)}>
                    {asset.status}
                  </Badge>
                </div>
                
                <div className="flex flex-col">
                  <span className="font-bold text-brand-text truncate text-sm leading-tight mb-1" title={asset.name}>{asset.name}</span>
                  <span className="text-[10px] uppercase font-semibold text-brand-muted tracking-wider">{getCategoryLabel(asset.categoryId)}</span>
                </div>

                <div className="flex flex-col gap-1.5 mt-2 text-xs text-brand-muted border-t border-brand-border/60 pt-2.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {asset.location}
                  </span>
                  <span className="text-[10px] font-mono">Cost: ${asset.acquisitionCost} | SN: {asset.serialNumber}</span>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-brand-border bg-gray-50 flex items-center justify-between">
                {/* TODO(BACKEND): Fetch/Generate Asset Badge action */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedAssetForQr(asset)}
                  className="!px-2 !py-1 text-xs text-brand-muted hover:text-brand-primary cursor-pointer"
                >
                  <QrCode className="h-3.5 w-3.5 mr-1" />
                  Show Badge
                </Button>
                {asset.sharedBookable && (
                  <Badge variant="secondary" className="text-[9px] font-bold">
                    Bookable
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* ==============================
            BACKEND INTEGRATION
            Table Render: Asset directory table rows
            Endpoint: GET /api/assets
            Returns: Asset[]
            ============================== */
        <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-brand-border">
            <thead className="bg-gray-50 font-bold text-brand-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Tag</th>
                <th className="px-6 py-3.5">Asset Name</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Condition</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-brand-text">
              {assets.map(asset => (
                <tr key={asset.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3.5 font-mono font-bold text-brand-primary cursor-pointer" onClick={() => copyToClipboard(asset.assetTag)}>
                    {asset.assetTag}
                  </td>
                  <td className="px-6 py-3.5 font-semibold">{asset.name}</td>
                  <td className="px-6 py-3.5">{getCategoryLabel(asset.categoryId)}</td>
                  <td className="px-6 py-3.5">{asset.location}</td>
                  <td className="px-6 py-3.5 font-semibold text-brand-muted">{asset.condition}</td>
                  <td className="px-6 py-3.5">
                    <Badge variant={getStatusBadgeVariant(asset.status)}>
                      {asset.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    {/* TODO(BACKEND): Fetch QR badge */}
                    <Button variant="ghost" size="sm" onClick={() => setSelectedAssetForQr(asset)} className="!p-1 cursor-pointer">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Code Dialog Mock */}
      {selectedAssetForQr && (
        <div className="fixed inset-0 bg-brand-text/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-brand-border rounded-xl p-6 shadow-xl w-full max-w-xs flex flex-col items-center gap-4 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">Asset Flow Badge Record</span>
            <img 
              src={selectedAssetForQr.qrCodeUrl} 
              alt={selectedAssetForQr.assetTag} 
              className="h-32 w-32 border p-2 bg-white rounded-lg"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <strong className="text-brand-text font-mono text-sm">{selectedAssetForQr.assetTag}</strong>
              <span className="text-xs text-brand-muted truncate max-w-[200px]">{selectedAssetForQr.name}</span>
            </div>
            <div className="flex gap-2 w-full mt-2">
              {/* TODO(BACKEND): Dispatch print job */}
              <Button size="sm" variant="primary" className="flex-1 cursor-pointer" onClick={() => {
                toast.success('Dispatched print job for high-resolution QR adhesive label.');
                setSelectedAssetForQr(null);
              }}>Print Tag</Button>
              <Button size="sm" variant="outline" className="flex-1 cursor-pointer" onClick={() => setSelectedAssetForQr(null)}>Dismiss</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AssetManagement;
