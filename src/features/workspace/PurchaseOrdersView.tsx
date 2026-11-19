import { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag, Plus, CheckCircle2,
  PackageCheck, Truck, FileText, Printer,
  Building, Calendar, X, RefreshCw
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { money } from '../../data/models';
import { api, VendorProfileItem, ProductItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';

interface POLineItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
  total: number;
}

interface PurchaseOrder {
  id: string;
  ref: string;
  name: string;
  vendorId: string;
  vendorName: string;
  status: 'Draft' | 'Approved' | 'Issued to Vendor' | 'Goods Received' | 'Completed';
  issueDate: string;
  expectedDate: string;
  terms: string;
  amount: number;
  lines: POLineItem[];
  notes?: string;
}

const DEFAULT_POS: PurchaseOrder[] = [
  {
    id: 'po-1',
    ref: 'PO-2026-00018',
    name: 'Core Optical Transceivers Replenishment',
    vendorId: 'ven-1',
    vendorName: 'Fujikura Optical Technologies Inc',
    status: 'Issued to Vendor',
    issueDate: '2026-11-14',
    expectedDate: '2026-11-28',
    terms: 'Net 30',
    amount: 42500,
    lines: [
      { id: 'l1', name: 'Optical Transceiver 100G QSFP28', sku: 'OPT-100G-QSFP28', quantity: 50, unitCost: 650, total: 32500 },
      { id: 'l2', name: 'High-Density Patch Fiber 10m', sku: 'FIB-HD-10M', quantity: 200, unitCost: 50, total: 10000 },
    ],
    notes: 'Urgent hardware batch for Q4 regional telecom deployment expansion.',
  },
  {
    id: 'po-2',
    ref: 'PO-2026-00019',
    name: 'Industrial Fiber Splicing Kits & Calibration',
    vendorId: 'ven-2',
    vendorName: 'Corning Optical Communications Ltd',
    status: 'Goods Received',
    issueDate: '2026-11-05',
    expectedDate: '2026-11-18',
    terms: 'Net 45',
    amount: 18200,
    lines: [
      { id: 'l3', name: 'Fusion Splicer Precision Tooling Pack', sku: 'TOOL-FUS-01', quantity: 4, unitCost: 4550, total: 18200 },
    ],
    notes: 'Delivered to Houston Logistics Hub. Inspection passed 100%.',
  },
  {
    id: 'po-3',
    ref: 'PO-2026-00020',
    name: 'Carrier Edge Routing Subsystems',
    vendorId: 'ven-3',
    vendorName: 'Cisco Systems Caribbean & Latin America',
    status: 'Approved',
    issueDate: '2026-11-19',
    expectedDate: '2026-12-05',
    terms: 'Net 60',
    amount: 68000,
    lines: [
      { id: 'l4', name: 'Enterprise Core Router Module', sku: 'ROUT-COR-MOD', quantity: 2, unitCost: 34000, total: 68000 },
    ],
    notes: 'Awaiting supplier confirmation of dispatch schedule.',
  },
];

export function PurchaseOrdersView() {
  const { addEvent, addAudit } = useCRM();
  const [orders, setOrders] = useState<PurchaseOrder[]>(DEFAULT_POS);
  const [vendors, setVendors] = useState<VendorProfileItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [toast, setToast] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formVendorId, setFormVendorId] = useState<string>('');
  const [formTerms, setFormTerms] = useState<string>('Net 30');
  const [formExpectedDate, setFormExpectedDate] = useState<string>('2026-12-15');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formLines, setFormLines] = useState<POLineItem[]>([
    { id: '1', name: 'Optical Transceiver 100G QSFP28', sku: 'OPT-100G-QSFP28', quantity: 10, unitCost: 650, total: 6500 },
  ]);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const loadVendorsAndProducts = async () => {
    try {
      const [vRes, pRes] = await Promise.allSettled([
        api.listVendors(),
        api.listProducts(),
      ]);
      if (vRes.status === 'fulfilled' && vRes.value) {
        setVendors(vRes.value);
        if (vRes.value.length > 0 && !formVendorId) {
          setFormVendorId(vRes.value[0].id);
        }
      }
      if (pRes.status === 'fulfilled' && pRes.value?.items) {
        setProducts(pRes.value.items);
      }
    } catch {
      // Handled
    }
  };

  useEffect(() => {
    loadVendorsAndProducts();
  }, []);

  const metrics = useMemo(() => {
    const totalCount = orders.length;
    const totalSpend = orders.reduce((s, o) => s + o.amount, 0);
    const inTransit = orders
      .filter(o => o.status === 'Issued to Vendor')
      .reduce((s, o) => s + o.amount, 0);
    const goodsReceivedCount = orders.filter(o => o.status === 'Goods Received').length;
    return { totalCount, totalSpend, inTransit, goodsReceivedCount };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (filter === 'All') return orders;
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  // Actions
  const handleIssuePO = (po: PurchaseOrder) => {
    setOrders(prev =>
      prev.map(o => (o.id === po.id ? { ...o, status: 'Issued to Vendor' } : o))
    );
    addEvent('po.issued', { ref: po.ref }, `Purchase Order ${po.ref} dispatched to vendor ${po.vendorName}`);
    addAudit('Purchase Order Issued', 'Arjun Mehta', `${po.ref} sent to ${po.vendorName}`);
    notify(`Purchase Order ${po.ref} officially issued to ${po.vendorName}!`);
  };

  const handleReceiveGoods = (po: PurchaseOrder) => {
    setOrders(prev =>
      prev.map(o => (o.id === po.id ? { ...o, status: 'Goods Received' } : o))
    );
    addEvent('po.received', { ref: po.ref }, `Goods received and verified for PO ${po.ref}`);
    addAudit('PO Goods Received', 'Arjun Mehta', `Inventory receipt recorded for ${po.ref}`);
    notify(`Goods received for ${po.ref}! Inventory records incremented.`);
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      notify('Please enter a purchase order name.');
      return;
    }
    const vendorObj = vendors.find(v => v.id === formVendorId);
    const vendorName = vendorObj?.account_name || vendorObj?.vendor_code || 'Selected Supplier';
    const totalAmount = formLines.reduce((s, l) => s + l.total, 0);
    const newRef = `PO-2026-${String(orders.length + 21).padStart(5, '0')}`;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      ref: newRef,
      name: formName.trim(),
      vendorId: formVendorId,
      vendorName,
      status: 'Approved',
      issueDate: new Date().toISOString().slice(0, 10),
      expectedDate: formExpectedDate,
      terms: formTerms,
      amount: totalAmount,
      lines: formLines,
      notes: formNotes,
    };

    setOrders(prev => [newPO, ...prev]);
    addEvent('po.created', { ref: newRef }, `Created Purchase Order ${newRef} for ${vendorName}`);
    addAudit('Purchase Order Created', 'Arjun Mehta', `${newRef}: ${money(totalAmount)} for ${vendorName}`);
    notify(`Purchase Order ${newRef} created and ready for issuance!`);
    setIsDrawerOpen(false);
    setFormName('');
    setFormNotes('');
  };

  return (
    <div className="workspace-page space-y-4">
      {/* Header */}
      <SectionHeading
        eyebrow="SALES & OPERATIONS / PROCUREMENT & VENDORS"
        title="Vendor Purchase Orders & Procurement Engine"
        subtitle="Manage supplier purchase orders, track vendor lead times, issue orders, and process inventory receipts."
        action={
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <Plus size={14} />
            <span>Create Purchase Order</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Active Purchase Orders</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {metrics.totalCount} Orders
          </strong>
          <small className="text-xs text-blue-700 block mt-1">Across approved suppliers</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Procurement Commit</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {money(metrics.totalSpend)}
          </strong>
          <small className="text-xs text-emerald-700 font-semibold block mt-1">Authorized corporate spend</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">In-Transit from Vendors</span>
          <strong className="text-xl font-bold text-purple-700 font-manrope block mt-1">
            {money(metrics.inTransit)}
          </strong>
          <small className="text-xs text-purple-700 block mt-1">Dispatched hardware & supplies</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Goods Received & Verified</span>
          <strong className="text-xl font-bold text-emerald-600 font-manrope block mt-1">
            {metrics.goodsReceivedCount} Deliveries
          </strong>
          <small className="text-xs text-emerald-700 block mt-1">Stock movements committed</small>
        </div>
      </div>

      {/* Orders Register & Filter Tabs */}
      <section className="panel p-5 bg-white border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 font-manrope">
              Purchase Orders Register
            </h2>
            <p className="text-xs text-slate-500">
              Complete vendor procurement records with lifecycle tracking and goods receiving actions.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {['All', 'Approved', 'Issued to Vendor', 'Goods Received'].map(st => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  filter === st
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="crm-table w-full">
            <thead>
              <tr>
                <th>PO REF</th>
                <th>PURCHASE ORDER NAME</th>
                <th>VENDOR / SUPPLIER</th>
                <th>AMOUNT (USD)</th>
                <th>PAYMENT TERMS</th>
                <th>EXPECTED DELIVERY</th>
                <th>STATUS</th>
                <th>PROCUREMENT ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(po => (
                <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                  <td>
                    <span className="ref-link font-mono text-xs font-bold">{po.ref}</span>
                  </td>
                  <td>
                    <strong className="text-xs text-slate-800 block">{po.name}</strong>
                    <span className="text-[10px] text-slate-400">{po.lines.length} Line items</span>
                  </td>
                  <td>
                    <span className="text-xs text-slate-700 font-semibold flex items-center gap-1">
                      <Building size={12} className="text-slate-400" />
                      {po.vendorName}
                    </span>
                  </td>
                  <td>
                    <strong className="text-xs text-slate-900 font-manrope">{money(po.amount)}</strong>
                  </td>
                  <td>
                    <span className="text-xs text-slate-600">{po.terms}</span>
                  </td>
                  <td>
                    <span className="text-xs font-mono text-slate-500">{po.expectedDate}</span>
                  </td>
                  <td>
                    <StatusPill status={po.status} />
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {po.status === 'Approved' && (
                        <button
                          onClick={() => handleIssuePO(po)}
                          className="btn primary text-[11px] py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                        >
                          <Truck size={11} /> Issue to Vendor
                        </button>
                      )}
                      {po.status === 'Issued to Vendor' && (
                        <button
                          onClick={() => handleReceiveGoods(po)}
                          className="btn primary text-[11px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                        >
                          <PackageCheck size={11} /> Receive Goods
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedPO(po);
                          window.print();
                        }}
                        className="btn secondary text-[11px] py-1 px-2 text-slate-600 hover:bg-slate-100 flex items-center gap-1"
                        title="Print Purchase Order PDF"
                      >
                        <Printer size={11} /> Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create Purchase Order Drawer */}
      {isDrawerOpen && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setIsDrawerOpen(false)}>
          <div className="form-modal">
            <div className="form-modal-head">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  VENDOR PROCUREMENT
                </span>
                <h2 className="text-base font-bold text-slate-800">Create Purchase Order</h2>
                <p className="text-xs text-slate-500">
                  Generate a formal purchase order linked to registered catalogue vendors and product specifications.
                </p>
              </div>
              <button
                type="button"
                className="icon-close"
                onClick={() => setIsDrawerOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="flex flex-col flex-1 overflow-hidden">
              <div className="form-modal-body space-y-4">
                <div className="form-grid">
                  <label className="wide">
                    <span>Purchase Order Title *</span>
                    <input
                      type="text"
                      placeholder="e.g. Q4 Regional Optical Splicing Kit Procurement"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      required
                    />
                  </label>

                  <label>
                    <span>Vendor / Supplier *</span>
                    <select
                      value={formVendorId}
                      onChange={e => setFormVendorId(e.target.value)}
                      required
                    >
                      {vendors.length > 0 ? (
                        vendors.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.account_name || v.vendor_code} ({v.ref})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="ven-1">Fujikura Optical Technologies Inc</option>
                          <option value="ven-2">Corning Optical Communications Ltd</option>
                          <option value="ven-3">Cisco Systems Caribbean & Latin America</option>
                        </>
                      )}
                    </select>
                  </label>

                  <label>
                    <span>Payment Terms</span>
                    <select
                      value={formTerms}
                      onChange={e => setFormTerms(e.target.value)}
                    >
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                      <option value="Advance 100%">100% Upfront Advance</option>
                    </select>
                  </label>

                  <label>
                    <span>Expected Delivery Date</span>
                    <input
                      type="date"
                      value={formExpectedDate}
                      onChange={e => setFormExpectedDate(e.target.value)}
                    />
                  </label>

                  <label>
                    <span>Delivery Location</span>
                    <input type="text" defaultValue="Houston Central Logistics Hub" />
                  </label>

                  <label className="wide">
                    <span>Procurement Notes & Delivery Instructions</span>
                    <textarea
                      rows={3}
                      placeholder="Include warehouse receiving instructions, carrier requirements, or inspection criteria..."
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                    />
                  </label>
                </div>

                {/* Line Items Builder */}
                <div className="line-builder">
                  <div className="line-builder-head">
                    <div>
                      <strong>Order Line Items</strong>
                      <small>Specify quantity and unit pricing for vendor goods.</small>
                    </div>
                  </div>

                  <table className="crm-table w-full text-xs">
                    <thead>
                      <tr>
                        <th>ITEM DESCRIPTION</th>
                        <th>SKU</th>
                        <th>QTY</th>
                        <th>UNIT COST ($)</th>
                        <th>LINE TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formLines.map(line => (
                        <tr key={line.id}>
                          <td><strong>{line.name}</strong></td>
                          <td><span className="font-mono text-slate-500">{line.sku}</span></td>
                          <td>{line.quantity}</td>
                          <td>${line.unitCost.toLocaleString()}</td>
                          <td><strong>${line.total.toLocaleString()}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="line-grand-total mt-3">
                    <span>Order Total:</span>
                    <strong>${formLines.reduce((s, l) => s + l.total, 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div className="form-modal-footer">
                <button
                  type="button"
                  className="btn secondary text-xs"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary text-xs">
                  Authorize & Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="inline-toast">
          <CheckCircle2 size={14} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
