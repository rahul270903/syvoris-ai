import { useState, useEffect, useMemo } from 'react';
import {
  Boxes, ShieldCheck, MapPin, AlertTriangle, Search, Plus, RefreshCw,
  CheckCircle2, ArrowUpDown, ArrowUpRight, ArrowDownLeft, X, Layers,
  DollarSign, PackageCheck, Truck, Warehouse, Eye, History, FileText, Trash2
} from 'lucide-react';
import { api, InventoryStockItem, StockMovementItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

interface StockRow {
  id: string;
  tenant_id?: string;
  ref?: string;
  product_id?: string;
  product_sku?: string;
  product_name?: string;
  location_id?: string;
  location_name?: string;
  location_code?: string;
  bin_location?: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  reorder_threshold: number;
  reorder_quantity: number;
  unit_of_measure: string;
  unit_cost: number;
  total_value: number;
  status?: string;
  custom_fields?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_STOCK_ITEMS: StockRow[] = [
  {
    id: 'stk-1',
    tenant_id: 'default',
    ref: 'STK-2026-0001',
    product_id: 'prod-4',
    product_sku: 'FBR-96-ARMORED',
    product_name: 'Single-Mode 96-Core Armored Fiber Cable (1000m Reel)',
    location_id: 'loc-1',
    location_name: 'Main Distribution Center (Kingston Core Hub)',
    location_code: 'WH-KIN-01',
    bin_location: 'Aisle 3 · Rack B · Bin 14',
    quantity_on_hand: 850,
    quantity_reserved: 120,
    quantity_available: 730,
    reorder_threshold: 300,
    reorder_quantity: 500,
    unit_of_measure: 'Reel (1000m)',
    unit_cost: 1100.00,
    total_value: 935000.00,
  },
  {
    id: 'stk-2',
    tenant_id: 'default',
    ref: 'STK-2026-0002',
    product_id: 'prod-5',
    product_sku: 'NCT-CISCO-9300',
    product_name: 'Cisco Catalyst 9300 48-Port PoE+ Managed Switch',
    location_id: 'loc-2',
    location_name: 'Logistics Free Trade Depot (Miami Hub)',
    location_code: 'WH-MIA-02',
    bin_location: 'Bay 7 · Shelf 2 · Bin 08',
    quantity_on_hand: 45,
    quantity_reserved: 38,
    quantity_available: 7,
    reorder_threshold: 20,
    reorder_quantity: 50,
    unit_of_measure: 'Unit',
    unit_cost: 2950.00,
    total_value: 132750.00,
  },
  {
    id: 'stk-3',
    tenant_id: 'default',
    ref: 'STK-2026-0003',
    product_id: 'prod-6',
    product_sku: 'NCT-NOKIA-7750',
    product_name: 'Nokia 7750 Service Router Edge Gateway',
    location_id: 'loc-1',
    location_name: 'Main Distribution Center (Kingston Core Hub)',
    location_code: 'WH-KIN-01',
    bin_location: 'High-Value Vault · C-02',
    quantity_on_hand: 12,
    quantity_reserved: 4,
    quantity_available: 8,
    reorder_threshold: 6,
    reorder_quantity: 10,
    unit_of_measure: 'Unit',
    unit_cost: 8200.00,
    total_value: 98400.00,
  },
  {
    id: 'stk-4',
    tenant_id: 'default',
    ref: 'STK-2026-0004',
    product_id: 'prod-7',
    product_sku: 'OPT-SFP-100G',
    product_name: '100G QSFP28 LR4 Optical Transceiver (10km)',
    location_id: 'loc-1',
    location_name: 'Main Distribution Center (Kingston Core Hub)',
    location_code: 'WH-KIN-01',
    bin_location: 'Optics Cabinet · Tray 03',
    quantity_on_hand: 240,
    quantity_reserved: 95,
    quantity_available: 145,
    reorder_threshold: 100,
    reorder_quantity: 200,
    unit_of_measure: 'Unit',
    unit_cost: 210.00,
    total_value: 50400.00,
  },
  {
    id: 'stk-5',
    tenant_id: 'default',
    ref: 'STK-2026-0005',
    product_id: 'prod-8',
    product_sku: 'OPT-FUSION-KIT',
    product_name: 'Precision Core-Alignment Optical Fusion Splicer Kit',
    location_id: 'loc-3',
    location_name: 'Secondary Regional Terminal (Montego Bay)',
    location_code: 'WH-MBJ-03',
    bin_location: 'Tool Crib · Rack 1',
    quantity_on_hand: 8,
    quantity_reserved: 6,
    quantity_available: 2,
    reorder_threshold: 5,
    reorder_quantity: 5,
    unit_of_measure: 'Kit',
    unit_cost: 3400.00,
    total_value: 27200.00,
  },
  {
    id: 'stk-6',
    tenant_id: 'default',
    ref: 'STK-2026-0006',
    product_id: 'prod-9',
    product_sku: 'ONT-10G-XGS',
    product_name: 'XGS-PON Optical Network Terminal (10G Symmetric)',
    location_id: 'loc-2',
    location_name: 'Logistics Free Trade Depot (Miami Hub)',
    location_code: 'WH-MIA-02',
    bin_location: 'Aisle 1 · Pallet D-12',
    quantity_on_hand: 1200,
    quantity_reserved: 450,
    quantity_available: 750,
    reorder_threshold: 500,
    reorder_quantity: 1000,
    unit_of_measure: 'Unit',
    unit_cost: 65.00,
    total_value: 78000.00,
  }
];

export function StockManagementView() {
  const { addEvent, addAudit, addToRecycleBin } = useCRM();

  const [stockItems, setStockItems] = useState<StockRow[]>(DEFAULT_STOCK_ITEMS);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItemForMovement, setSelectedItemForMovement] = useState<StockRow | null>(null);
  const [detailItem, setDetailItem] = useState<StockRow | null>(null);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const loadStock = async () => {
    setIsLoading(true);
    try {
      const liveList = await api.listStockItems();
      if (liveList && liveList.length > 0) {
        const map = new Map<string, StockRow>();
        DEFAULT_STOCK_ITEMS.forEach(s => map.set(s.product_sku || s.id, s));
        liveList.forEach(s => {
          const sku = s.product_sku || s.id;
          const existing = map.get(sku) || ({} as StockRow);
          map.set(sku, {
            ...existing,
            ...s,
            unit_cost: existing.unit_cost || 500,
            total_value: (s.quantity_on_hand || 0) * (existing.unit_cost || 500),
            bin_location: existing.bin_location || 'Standard Storage'
          });
        });
        setStockItems(Array.from(map.values()));
      }
      notify('Refreshed stock inventory records from database.');
    } catch (err) {
      console.warn('Load stock fallback to default inventory:', err);
      notify('Refreshed stock records from local cache.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStockItem = async (item: StockRow) => {
    if (!window.confirm(`Move inventory item ${item.product_sku} (${item.product_name}) to recycle bin?`)) return;
    try {
      setStockItems(prev => prev.filter(s => s.id !== item.id));
      if (detailItem && detailItem.id === item.id) setDetailItem(null);

      addToRecycleBin({
        id: item.id,
        ref: item.product_sku || item.ref || 'STK',
        title: item.product_name || 'Stock Item',
        entity: 'stockPolicies',
        description: `Warehouse: ${item.location_name} (Bin: ${item.bin_location}). Qty on hand: ${item.quantity_on_hand} ${item.unit_of_measure}`
      });

      notify(`Stock item ${item.product_sku} moved to recycle bin.`);
      addAudit('Stock Item Deleted', 'Arjun Mehta', `Deleted ${item.product_sku}`);
    } catch (err: any) {
      notify(err.message || 'Failed to delete stock item.');
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  // Form State for Stock Movement / Adjustment
  const [movementForm, setMovementForm] = useState({
    movement_type: 'RECEIPT', // RECEIPT, DISPATCH, ADJUSTMENT, SCRAP
    quantity: '10',
    reference_doc: 'PO-2026-0042',
    reason: 'Routine warehouse replenishment restock',
  });

  // Form State for New Stock Record
  const [newStock, setNewStock] = useState({
    product_sku: '',
    product_name: '',
    location_name: 'Main Distribution Center (Kingston Core Hub)',
    location_code: 'WH-KIN-01',
    bin_location: 'Aisle 2 · Rack A',
    quantity_on_hand: '100',
    reorder_threshold: '25',
    reorder_quantity: '50',
    unit_of_measure: 'Unit',
    unit_cost: '450.00',
  });

  // Filtered Stock Items
  const filteredStock = useMemo(() => {
    return stockItems.filter(item => {
      if (selectedLocation !== 'all' && !item.location_name?.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false;
      }

      const isCritical = item.quantity_available <= (item.reorder_threshold * 0.5);
      const isLow = !isCritical && item.quantity_available <= item.reorder_threshold;
      const isHealthy = !isCritical && !isLow;

      if (healthFilter === 'critical' && !isCritical) return false;
      if (healthFilter === 'low' && !isLow) return false;
      if (healthFilter === 'healthy' && !isHealthy) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mSku = (item.product_sku || '').toLowerCase().includes(q);
        const mName = (item.product_name || '').toLowerCase().includes(q);
        const mBin = (item.bin_location || '').toLowerCase().includes(q);
        const mLoc = (item.location_name || '').toLowerCase().includes(q);
        if (!mSku && !mName && !mBin && !mLoc) return false;
      }
      return true;
    });
  }, [stockItems, selectedLocation, healthFilter, searchQuery]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const totalSKUs = stockItems.length;
    const totalOnHand = stockItems.reduce((acc, s) => acc + (s.quantity_on_hand || 0), 0);
    const totalReserved = stockItems.reduce((acc, s) => acc + (s.quantity_reserved || 0), 0);
    const totalATP = stockItems.reduce((acc, s) => acc + (s.quantity_available || 0), 0);
    const totalValuation = stockItems.reduce((acc, s) => acc + (s.total_value || (s.quantity_on_hand * s.unit_cost)), 0);
    const reorderAlerts = stockItems.filter(s => s.quantity_available <= s.reorder_threshold).length;

    return { totalSKUs, totalOnHand, totalReserved, totalATP, totalValuation, reorderAlerts };
  }, [stockItems]);

  // Execute Stock Movement / Adjustment
  const handleExecuteMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForMovement) return;

    const qty = parseInt(movementForm.quantity, 10) || 0;
    if (qty <= 0) {
      alert('Movement quantity must be greater than 0.');
      return;
    }

    const item = selectedItemForMovement;
    let newOnHand = item.quantity_on_hand;
    let newAvailable = item.quantity_available;

    if (movementForm.movement_type === 'RECEIPT') {
      newOnHand += qty;
      newAvailable += qty;
    } else if (movementForm.movement_type === 'DISPATCH' || movementForm.movement_type === 'SCRAP') {
      if (qty > newAvailable) {
        alert(`Cannot dispatch ${qty} units. Only ${newAvailable} units Available to Promise.`);
        return;
      }
      newOnHand -= qty;
      newAvailable -= qty;
    } else if (movementForm.movement_type === 'ADJUSTMENT') {
      // Direct adjustment replaces on hand
      newOnHand = qty;
      newAvailable = Math.max(0, qty - item.quantity_reserved);
    }

    const updatedRow: StockRow = {
      ...item,
      quantity_on_hand: newOnHand,
      quantity_available: newAvailable,
      total_value: newOnHand * item.unit_cost
    };

    setStockItems(prev => prev.map(s => s.id === item.id ? updatedRow : s));

    try {
      await api.recordStockMovement({
        inventory_item_id: item.id,
        movement_type: movementForm.movement_type,
        quantity: qty,
        reference_doc_type: 'ManualMovement',
        reference_doc_id: movementForm.reference_doc,
        reason: movementForm.reason
      });
      addEvent('inventory.movement', { ref: item.product_sku || item.ref || 'STK' }, `Recorded ${movementForm.movement_type} of ${qty} units for ${item.product_sku}`);
      addAudit(`Stock movement ${movementForm.movement_type}: ${qty} units`, 'Inventory', item.id);
      notify(`Stock updated: ${item.product_sku} on hand is now ${newOnHand} units.`);
    } catch (err) {
      console.warn('API movement fallback, local state applied:', err);
      notify(`Stock movement registered locally for ${item.product_sku}.`);
    }

    setShowMovementModal(false);
    setSelectedItemForMovement(null);
  };

  // Submit Create New Stock Item
  const handleCreateStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStock.product_sku || !newStock.product_name) {
      alert('Please fill in Product SKU and Product Name.');
      return;
    }

    const onHand = parseInt(newStock.quantity_on_hand, 10) || 0;
    const threshold = parseInt(newStock.reorder_threshold, 10) || 20;
    const reorderQty = parseInt(newStock.reorder_quantity, 10) || 50;
    const unitCost = parseFloat(newStock.unit_cost) || 100;

    const payload: Partial<InventoryStockItem> = {
      product_sku: newStock.product_sku.toUpperCase().trim(),
      product_name: newStock.product_name.trim(),
      location_name: newStock.location_name,
      location_code: newStock.location_code,
      quantity_on_hand: onHand,
      quantity_reserved: 0,
      quantity_available: onHand,
      reorder_threshold: threshold,
      reorder_quantity: reorderQty,
      unit_of_measure: newStock.unit_of_measure,
    };

    try {
      const created = await api.createStockItem(payload);
      const newRow: StockRow = {
        ...created,
        unit_cost: unitCost,
        total_value: onHand * unitCost,
        bin_location: newStock.bin_location,
      };
      setStockItems(prev => [newRow, ...prev]);
      addEvent('inventory.created', { ref: newRow.product_sku || 'STK' }, `Created new warehouse inventory tracking for ${newRow.product_sku}`);
      addAudit(`Stock tracking created for ${newRow.product_sku}`, 'Inventory', created.id);
      notify(`Stock item ${newRow.product_sku} registered at ${newRow.location_name}.`);
    } catch (err) {
      console.warn('API create fallback:', err);
      const fallbackRow: StockRow = {
        id: `stk-local-${Date.now()}`,
        tenant_id: 'default',
        ref: `STK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        product_id: `prod-local-${Date.now()}`,
        product_sku: payload.product_sku!,
        product_name: payload.product_name!,
        location_id: 'loc-local',
        location_name: payload.location_name!,
        location_code: payload.location_code!,
        bin_location: newStock.bin_location,
        quantity_on_hand: onHand,
        quantity_reserved: 0,
        quantity_available: onHand,
        reorder_threshold: threshold,
        reorder_quantity: reorderQty,
        unit_of_measure: payload.unit_of_measure!,
        unit_cost: unitCost,
        total_value: onHand * unitCost,
      };
      setStockItems(prev => [fallbackRow, ...prev]);
      notify(`Stock item ${fallbackRow.product_sku} saved to local inventory.`);
    }

    setShowCreateModal(false);
    setNewStock({
      product_sku: '',
      product_name: '',
      location_name: 'Main Distribution Center (Kingston Core Hub)',
      location_code: 'WH-KIN-01',
      bin_location: 'Aisle 2 · Rack A',
      quantity_on_hand: '100',
      reorder_threshold: '25',
      reorder_quantity: '50',
      unit_of_measure: 'Unit',
      unit_cost: '450.00',
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-200 text-xs px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="text-cyan-400 flex-shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Standard Section Heading */}
      <SectionHeading
        eyebrow="PRODUCT & SERVICE CATALOGUE / STOCK MANAGEMENT"
        title="Stock Management & ATP Inventory"
        subtitle="Live physical warehouse inventory, Available-to-Promise (ATP) line reservations, replenishment safety points, and multi-depot stock ledger."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadStock}
              disabled={isLoading}
              className="btn secondary flex items-center gap-1.5"
              title="Refresh stock ledger from database"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin text-cyan-400' : ''} />
              <span>Refresh Stock</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn primary flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>+ Add Stock Item</span>
            </button>
          </div>
        }
      />

      {/* Telemetry KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tracked SKUs</span>
            <Layers size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{kpis.totalSKUs}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Physical Hardware Master</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Units On Hand</span>
            <Boxes size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{kpis.totalOnHand.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Physical Stock in Depots</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Reserved Orders</span>
            <PackageCheck size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{kpis.totalReserved.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Allocated to Sales Orders</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Net ATP Available</span>
            <CheckCircle2 size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">{kpis.totalATP.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ready for New Orders</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Valuation</span>
            <DollarSign size={14} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">${(kpis.totalValuation / 1000).toFixed(0)}k</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Standard Cost Basis</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Warehouse Location Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950/70 border border-slate-800/80 p-1 rounded-lg text-xs">
            {[
              { id: 'all', label: 'All Warehouses' },
              { id: 'Kingston', label: 'Kingston Core Hub' },
              { id: 'Miami', label: 'Miami Free Zone Depot' },
              { id: 'Montego', label: 'Montego Bay Terminal' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedLocation(tab.id)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  selectedLocation === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Health Filter Dropdown */}
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Health States</option>
            <option value="healthy">Healthy Stock</option>
            <option value="low">Low Stock Warning</option>
            <option value="critical">Critical Reorder</option>
          </select>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search SKU, product, bin code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Boxes size={16} className="text-cyan-400" />
            <span>Warehouse Inventory & ATP Availability Ledger</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
              {filteredStock.length} inventory records
            </span>
          </h3>
          <span className="text-xs text-slate-500">Live multi-facility stock reservations & bin allocation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1050px]">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold min-w-[130px]">SKU Code & Ref</th>
                <th className="py-3 px-4 font-semibold min-w-[260px]">Product Master</th>
                <th className="py-3 px-4 font-semibold min-w-[200px]">Warehouse & Bin</th>
                <th className="py-3 px-4 font-semibold text-right min-w-[90px]">On Hand</th>
                <th className="py-3 px-4 font-semibold text-right min-w-[90px]">Reserved</th>
                <th className="py-3 px-4 font-semibold text-right min-w-[110px] text-cyan-400">Available (ATP)</th>
                <th className="py-3 px-4 font-semibold text-right min-w-[110px]">Reorder Point</th>
                <th className="py-3 px-4 font-semibold text-center min-w-[120px]">Stock Health</th>
                <th className="py-3 px-4 font-semibold text-right min-w-[100px]">Unit Cost</th>
                <th className="py-3 px-4 font-semibold text-right min-w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    No warehouse inventory records match your current filter parameters.
                  </td>
                </tr>
              ) : (
                filteredStock.map((item) => {
                  const isCritical = item.quantity_available <= (item.reorder_threshold * 0.5);
                  const isLow = !isCritical && item.quantity_available <= item.reorder_threshold;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setDetailItem(item)}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-cyan-400 text-xs">{item.product_sku}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.ref}</div>
                      </td>
                      <td className="py-3 px-4 min-w-[260px] whitespace-normal">
                        <div className="font-bold text-slate-100 text-xs leading-snug group-hover:text-cyan-300 transition-colors">
                          {item.product_name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          UOM: {item.unit_of_measure}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-normal">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <Warehouse className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="font-medium">{item.location_name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 pl-5">
                          {item.bin_location}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-100">
                        {item.quantity_on_hand.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400">
                        {item.quantity_reserved.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-cyan-400">
                        {item.quantity_available.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {item.reorder_threshold} <span className="text-[10px] text-slate-500">(+{item.reorder_quantity})</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" /> Critical
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Healthy
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        ${item.unit_cost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedItemForMovement(item);
                              setShowMovementModal(true);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-[11px] font-medium transition-colors"
                          >
                            Adjust Stock
                          </button>
                          <button
                            onClick={() => handleDeleteStockItem(item)}
                            title="Move to Recycle Bin"
                            className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Adjust Stock / Record Stock Movement */}
      {showMovementModal && selectedItemForMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Record Stock Movement</h3>
                  <p className="text-xs text-slate-400">{selectedItemForMovement.product_sku}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMovementModal(false);
                  setSelectedItemForMovement(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteMovement} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Current Physical On Hand:</span>
                  <span className="font-mono font-bold text-white">{selectedItemForMovement.quantity_on_hand} {selectedItemForMovement.unit_of_measure}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Reserved Against Orders:</span>
                  <span className="font-mono text-amber-400">{selectedItemForMovement.quantity_reserved} {selectedItemForMovement.unit_of_measure}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Net Available to Promise (ATP):</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedItemForMovement.quantity_available} {selectedItemForMovement.unit_of_measure}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Movement Type
                </label>
                <select
                  value={movementForm.movement_type}
                  onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="RECEIPT">Inbound Receipt (+) from Supplier Purchase Order</option>
                  <option value="DISPATCH">Outbound Dispatch (-) for Sales Order Fulfillment</option>
                  <option value="ADJUSTMENT">Physical Cycle Count Audit (Set Exact Count)</option>
                  <option value="SCRAP">Damaged Scrap / Quality Quarantine (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Quantity ({selectedItemForMovement.unit_of_measure}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Reference Document Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PO-2026-0042, SO-2026-0018, CYCLE-AUDIT-Q4"
                  value={movementForm.reference_doc}
                  onChange={(e) => setMovementForm({ ...movementForm, reference_doc: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Movement Reason & Notes
                </label>
                <textarea
                  rows={2}
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowMovementModal(false);
                    setSelectedItemForMovement(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-sky-600/25 transition-all"
                >
                  Confirm Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Stock Item */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Add Warehouse Inventory Item</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStockItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Product SKU *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FBR-48-ARMORED"
                    value={newStock.product_sku}
                    onChange={(e) => setNewStock({ ...newStock, product_sku: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Unit of Measure
                  </label>
                  <input
                    type="text"
                    placeholder="Unit, Reel, Pack, Kit"
                    value={newStock.unit_of_measure}
                    onChange={(e) => setNewStock({ ...newStock, unit_of_measure: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Product Description / Catalog Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 48-Core Outdoor Armored Fiber Cable (1000m)"
                  value={newStock.product_name}
                  onChange={(e) => setNewStock({ ...newStock, product_name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Warehouse Facility
                  </label>
                  <select
                    value={newStock.location_name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const code = name.includes('Kingston') ? 'WH-KIN-01' : name.includes('Miami') ? 'WH-MIA-02' : 'WH-MBJ-03';
                      setNewStock({ ...newStock, location_name: name, location_code: code });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Main Distribution Center (Kingston Core Hub)">Main DC (Kingston Core Hub)</option>
                    <option value="Logistics Free Trade Depot (Miami Hub)">Logistics Depot (Miami Hub)</option>
                    <option value="Secondary Regional Terminal (Montego Bay)">Regional Terminal (Montego Bay)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Bin / Shelf Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aisle 3 · Rack C · Bin 12"
                    value={newStock.bin_location}
                    onChange={(e) => setNewStock({ ...newStock, bin_location: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Initial On Hand Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newStock.quantity_on_hand}
                    onChange={(e) => setNewStock({ ...newStock, quantity_on_hand: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Reorder Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newStock.reorder_threshold}
                    onChange={(e) => setNewStock({ ...newStock, reorder_threshold: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Unit Cost (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newStock.unit_cost}
                    onChange={(e) => setNewStock({ ...newStock, unit_cost: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-sky-600/25 transition-all"
                >
                  Add to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Detail Item Inspection */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 p-6 h-full overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-base font-bold text-white">{detailItem.product_sku}</h3>
                  <p className="text-xs text-slate-400">{detailItem.product_name}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Warehouse Facility:</span>
                  <span className="font-semibold text-white">{detailItem.location_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Facility Code:</span>
                  <span className="font-mono text-sky-400">{detailItem.location_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bin / Shelf Location:</span>
                  <span className="font-mono text-slate-300">{detailItem.bin_location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unit of Measure:</span>
                  <span className="font-medium text-white">{detailItem.unit_of_measure}</span>
                </div>
              </div>

              {/* Stock breakdown */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Physical Stock On Hand:</span>
                  <span className="font-mono font-bold text-white text-sm">{detailItem.quantity_on_hand.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Committed to Customer Orders:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">-{detailItem.quantity_reserved.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-700/80 flex justify-between font-bold text-sm">
                  <span className="text-slate-200">Net Available to Promise (ATP):</span>
                  <span className="font-mono text-cyan-400 text-base">{detailItem.quantity_available.toLocaleString()}</span>
                </div>
              </div>

              {/* Valuation & Replenishment */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Unit Standard Cost:</span>
                  <span className="font-mono text-white">${detailItem.unit_cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Asset Valuation:</span>
                  <span className="font-mono font-bold text-emerald-400">${detailItem.total_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Safety Reorder Point:</span>
                  <span className="font-mono text-slate-300">{detailItem.reorder_threshold} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Economic Order Qty (EOQ):</span>
                  <span className="font-mono text-sky-400">+{detailItem.reorder_quantity} units</span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    setSelectedItemForMovement(detailItem);
                    setShowMovementModal(true);
                    setDetailItem(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  Adjust Stock / Movement
                </button>
                <button
                  onClick={() => setDetailItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
