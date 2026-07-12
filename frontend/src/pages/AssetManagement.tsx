import * as React from 'react';
import { motion } from 'motion/react';
import { Package, Search, LayoutGrid, List, Plus, QrCode, MapPin, Tag } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { assetService, AssetFilterOptions } from '../services/asset.service';
import { Asset, AssetCategory } from '../types';
import toast from 'react-hot-toast';

export const AssetManagement: React.FC = () => {
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');
  const [assets, setAssets] = React.useState<Asset[]>([]);
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
          <h1 className="text-2xl font-black tracking-tight text-sahara-coffee">Asset Directory</h1>
          <p className="text-xs text-sahara-clay/70 font-semibold leading-relaxed">Search, audit, and inventory all corporate property. Direct QR printing is available.</p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="cursor-pointer rounded-xl text-xs uppercase tracking-wider font-bold">
          <Plus className="h-4 w-4 mr-1.5" />
          {showAddForm ? 'Cancel Form' : 'Register New Asset'}
        </Button>
      </div>

      {/* Inline Registration Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="overflow-hidden"
        >
          <Card className="border-sahara-sand/30 bg-sahara-light/20 shadow-md">
            <CardHeader>
              <CardTitle className="text-[10px]">Physical Property Logs Sheet</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleRegisterAsset} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <Input
                  label="Asset Name *"
                  placeholder="e.g. Dell Monitor 27'"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-white/60"
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-sahara-clay/90 uppercase tracking-widest pl-0.5">Classification Group *</label>
                  <select
                    className="w-full px-4 py-2.5 text-sm bg-white/60 backdrop-blur-xs border border-sahara-sand/35 rounded-xl outline-none focus:border-sahara-gold focus:ring-4 focus:ring-sahara-gold/10 transition-all text-sahara-coffee font-semibold cursor-pointer"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    required
                  >
                    <option value="" className="font-semibold text-sahara-clay/60">Select Category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <Input
                  label="Serial Number (Optional)"
                  placeholder="System auto-generates if omitted"
                  value={newSerial}
                  className="bg-white/60"
                  onChange={(e) => setNewSerial(e.target.value)}
                />
                <Input
                  type="number"
                  label="Acquisition Cost ($USD)"
                  placeholder="1200"
                  value={newCost}
                  className="bg-white/60"
                  onChange={(e) => setNewCost(e.target.value)}
                />
                <Input
                  label="Storage/Placement Location *"
                  placeholder="e.g. Storage Shelf B12"
                  value={newLoc}
                  className="bg-white/60"
                  onChange={(e) => setNewLoc(e.target.value)}
                  required
                />
                <div className="flex items-center gap-3.5 h-full sm:pt-6 pl-0.5">
                  <input
                    type="checkbox"
                    id="bookableCheckbox"
                    className="h-4 w-4 rounded border-sahara-sand/40 text-sahara-gold focus:ring-sahara-gold cursor-pointer"
                    checked={newBookable}
                    onChange={(e) => setNewBookable(e.target.checked)}
                  />
                  <label htmlFor="bookableCheckbox" className="text-[10px] font-bold text-sahara-clay uppercase tracking-widest cursor-pointer select-none">
                    Shared bookable resource
                  </label>
                </div>
                <div className="sm:col-span-2 md:col-span-3 flex justify-end gap-3 border-t border-sahara-sand/15 pt-5 mt-2">
                  <Button type="submit" className="px-6 rounded-xl text-xs uppercase tracking-wider font-extrabold cursor-pointer">Record to Ledger</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filter Row */}
      <Card className="bg-white/70 backdrop-blur-md border border-sahara-sand/15 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-[11px] h-4 w-4 text-sahara-clay/50" />
            <input
              type="text"
              placeholder="Filter by name, serial, location..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-white/40 border border-sahara-sand/25 rounded-xl outline-none focus:border-sahara-gold focus:ring-4 focus:ring-sahara-gold/10 transition-all text-sahara-coffee font-semibold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <select
              className="px-4 py-2 text-xs bg-white/50 border border-sahara-sand/25 rounded-xl outline-none font-bold text-sahara-coffee cursor-pointer"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              className="px-4 py-2 text-xs bg-white/50 border border-sahara-sand/25 rounded-xl outline-none font-bold text-sahara-coffee cursor-pointer"
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
            <div className="flex border border-sahara-sand/20 rounded-xl p-0.5 bg-sahara-light/40">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all duration-300 cursor-pointer ${viewMode === 'grid' ? 'bg-white text-sahara-gold shadow-md shadow-sahara-clay/5' : 'text-sahara-clay/60 hover:text-sahara-coffee'}`}
                title="Grid representation"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all duration-300 cursor-pointer ${viewMode === 'table' ? 'bg-white text-sahara-gold shadow-md shadow-sahara-clay/5' : 'text-sahara-clay/60 hover:text-sahara-coffee'}`}
                title="List representation"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Directory Grid/Table Rendering */}
      {isLoading ? (
        <div className="text-center py-24 text-[10px] font-black text-sahara-gold uppercase tracking-widest">Syncing directory streams...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-sahara-sand/30 rounded-[22px] bg-white/50 backdrop-blur-md flex flex-col items-center gap-4 shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-sahara-light/80 flex items-center justify-center text-sahara-gold">
            <Package className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-sahara-coffee uppercase tracking-widest">No assets match criteria</span>
            <p className="text-xs text-sahara-clay/70 max-w-xs leading-relaxed font-semibold">Adjust search parameters or log a new physical property record above.</p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {assets.map((asset, idx) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: idx * 0.04, type: 'spring', stiffness: 150, damping: 15 }}
            >
              <Card className="silk-card flex flex-col justify-between h-full shadow-md">
                <div className="p-6 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between border-b border-sahara-sand/10 pb-2.5">
                    <div 
                      onClick={() => copyToClipboard(asset.assetTag)}
                      className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-sahara-gold hover:text-sahara-terracotta transition-colors cursor-pointer"
                    >
                      <Tag className="h-3 w-3" />
                      {asset.assetTag}
                    </div>
                    <Badge variant={getStatusBadgeVariant(asset.status)}>
                      {asset.status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="font-extrabold text-sahara-coffee truncate text-sm leading-tight mb-1" title={asset.name}>{asset.name}</span>
                    <span className="text-[9px] uppercase font-black text-sahara-clay/65 tracking-widest">{getCategoryLabel(asset.categoryId)}</span>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2.5 border-t border-sahara-sand/10 pt-3 text-xs text-sahara-clay/80 font-medium">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-sahara-gold flex-shrink-0" />
                      {asset.location}
                    </span>
                    <span className="text-[10px] font-mono text-sahara-clay/55 font-bold mt-0.5">
                      Cost: ${asset.acquisitionCost} &bull; SN: {asset.serialNumber}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-3.5 border-t border-sahara-sand/10 bg-sahara-light/10 flex items-center justify-between rounded-b-[20px]">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedAssetForQr(asset)}
                    className="!px-2.5 !py-1 text-xs text-sahara-clay/80 hover:text-sahara-gold cursor-pointer font-bold"
                  >
                    <QrCode className="h-3.5 w-3.5 mr-1 text-sahara-gold" />
                    Show Badge
                  </Button>
                  {asset.sharedBookable && (
                    <Badge variant="secondary" className="text-[8px] font-black">
                      Bookable
                    </Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white/75 backdrop-blur-md border border-sahara-sand/15 rounded-2xl shadow-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-sahara-sand/10 min-w-[700px]">
            <thead className="bg-sahara-light/30 font-bold text-sahara-clay uppercase tracking-widest text-[9px] border-b border-sahara-sand/15">
              <tr>
                <th className="px-6 py-4.5">Tag</th>
                <th className="px-6 py-4.5">Asset Name</th>
                <th className="px-6 py-4.5">Category</th>
                <th className="px-6 py-4.5">Location</th>
                <th className="px-6 py-4.5">Condition</th>
                <th className="px-6 py-4.5">Status</th>
                <th className="px-6 py-4.5 text-right">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sahara-sand/10 text-sahara-coffee font-semibold">
              {assets.map((asset, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  key={asset.id} 
                  className="luxury-table-row hover:bg-sahara-sand/5"
                >
                  <td 
                    onClick={() => copyToClipboard(asset.assetTag)}
                    className="px-6 py-4 font-mono font-black text-sahara-gold cursor-pointer"
                  >
                    {asset.assetTag}
                  </td>
                  <td className="px-6 py-4 text-sahara-coffee font-extrabold">{asset.name}</td>
                  <td className="px-6 py-4 text-sahara-clay/80">{getCategoryLabel(asset.categoryId)}</td>
                  <td className="px-6 py-4 text-sahara-clay/80">{asset.location}</td>
                  <td className="px-6 py-4 text-sahara-clay/60 uppercase font-black tracking-wider text-[10px]">{asset.condition}</td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusBadgeVariant(asset.status)}>
                      {asset.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedAssetForQr(asset)} 
                      className="!p-1.5 cursor-pointer text-sahara-gold hover:bg-sahara-sand/10 rounded-lg"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Code Dialog: Fully redesigned with Sahara Glass theme */}
      {selectedAssetForQr && (
        <div className="fixed inset-0 bg-sahara-coffee/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-lg border border-sahara-sand/35 rounded-2xl p-7 shadow-2xl w-full max-w-xs flex flex-col items-center gap-5 text-center relative"
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-sahara-gold">Asset Flow System Tag</span>
            
            <div className="relative p-3.5 bg-gradient-to-tr from-sahara-cream to-white rounded-2xl border border-sahara-sand/15 shadow-inner">
              <img 
                src={selectedAssetForQr.qrCodeUrl} 
                alt={selectedAssetForQr.assetTag} 
                className="h-32 w-32 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="flex flex-col mt-1.5">
              <strong className="text-sahara-coffee font-mono text-base font-black tracking-wider">{selectedAssetForQr.assetTag}</strong>
              <span className="text-xs text-sahara-clay/80 font-bold truncate max-w-[200px] mt-0.5">{selectedAssetForQr.name}</span>
            </div>
            
            <div className="flex gap-2.5 w-full mt-3.5">
              <Button size="sm" variant="primary" className="flex-1 cursor-pointer rounded-xl font-bold text-xs uppercase" onClick={() => {
                toast.success('Dispatched print job for high-resolution QR adhesive label.');
                setSelectedAssetForQr(null);
              }}>Print Tag</Button>
              <Button size="sm" variant="outline" className="flex-1 cursor-pointer rounded-xl font-bold text-xs uppercase" onClick={() => setSelectedAssetForQr(null)}>Dismiss</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default AssetManagement;
