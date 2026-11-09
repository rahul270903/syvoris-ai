import { useState } from 'react';
import {
  Truck, PackageCheck, CheckCircle2, Clock, Copy,
  Check, ArrowRight, Building2, MapPin, Box
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { money } from '../../data/models';

type FulfillmentStage = 'Placed' | 'Allocated' | 'Packed' | 'Shipped' | 'Delivered';

interface FulfillmentOrder {
  id: string;
  orderRef: string;
  customer: string;
  destination: string;
  amount: number;
  stage: FulfillmentStage;
  carrier: string;
  tracking: string;
  warehouse: string;
  itemsCount: number;
  estDelivery: string;
  updatedAt: string;
}

const defaultFulfillments: FulfillmentOrder[] = [
  {
    id: 'ful-1',
    orderRef: 'SO-2026-031',
    customer: 'NovaTech Solutions',
    destination: 'San Francisco, CA (HQ DC-1)',
    amount: 148500,
    stage: 'Shipped',
    carrier: 'FedEx Priority Freight',
    tracking: 'FX-884920194US',
    warehouse: 'Chicago Central Depot',
    itemsCount: 14,
    estDelivery: '2026-11-12',
    updatedAt: '2 hours ago',
  },
  {
    id: 'ful-2',
    orderRef: 'SO-2026-032',
    customer: 'Apex Global Logistics',
    destination: 'Rotterdam Terminal Hub',
    amount: 220000,
    stage: 'Packed',
    carrier: 'DHL Global Forwarding',
    tracking: 'DHL-992014820NL',
    warehouse: 'Frankfurt European Hub',
    itemsCount: 8,
    estDelivery: '2026-11-14',
    updatedAt: '4 hours ago',
  },
  {
    id: 'ful-3',
    orderRef: 'SO-2026-033',
    customer: 'Horizon Healthtech',
    destination: 'Boston, MA (Medical Tech Lab)',
    amount: 88000,
    stage: 'Allocated',
    carrier: 'Specialized Medical Courier',
    tracking: 'SMC-331049281US',
    warehouse: 'New Jersey Biologics Center',
    itemsCount: 3,
    estDelivery: '2026-11-16',
    updatedAt: 'Yesterday',
  },
  {
    id: 'ful-4',
    orderRef: 'SO-2026-029',
    customer: 'QuantumCore Systems',
    destination: 'Austin, TX (Fab Facility)',
    amount: 340000,
    stage: 'Delivered',
    carrier: 'Direct Dedicated Freight',
    tracking: 'DDF-104928104US',
    warehouse: 'Dallas Regional Logistics',
    itemsCount: 22,
    estDelivery: 'Delivered (Nov 6)',
    updatedAt: 'Nov 6',
  }
];

const stages: { key: FulfillmentStage; label: string }[] = [
  { key: 'Placed', label: 'Order Confirmed' },
  { key: 'Allocated', label: 'Stock Allocated' },
  { key: 'Packed', label: 'Packed & QA' },
  { key: 'Shipped', label: 'In Transit' },
  { key: 'Delivered', label: 'Delivered & Accepted' },
];

export function OrderFulfilmentView() {
  const { addEvent, addAudit } = useCRM();

  const [orders, setOrders] = useState<FulfillmentOrder[]>(defaultFulfillments);
  const [selectedId, setSelectedId] = useState<string>(defaultFulfillments[0].id);
  const [toast, setToast] = useState('');

  const active = orders.find(o => o.id === selectedId) || orders[0];

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const stageIndex = (s: FulfillmentStage) => stages.findIndex(st => st.key === s);

  const handleAdvance = (order: FulfillmentOrder) => {
    const idx = stageIndex(order.stage);
    if (idx >= stages.length - 1) {
      notify('Order is already in the final delivered state.');
      return;
    }
    const nextStage = stages[idx + 1].key;
    setOrders(prev =>
      prev.map(o => (o.id === order.id ? { ...o, stage: nextStage, updatedAt: 'Just now' } : o))
    );
    addEvent('order.fulfilment_updated', { ref: order.orderRef }, `Fulfillment progressed to ${nextStage} for ${order.customer}`);
    addAudit('Fulfillment Milestone Advanced', 'Demo User', `${order.orderRef}: ${order.stage} -> ${nextStage}`);
    notify(`${order.orderRef} advanced to "${stages[idx + 1].label}". Customer notified.`);
  };

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="SALES ORDERS & FULFILMENT / LOGISTICS TRACKER"
        title="Order Fulfilment & Dispatch Cockpit"
        subtitle="Track end-to-end delivery execution, inventory reservation, freight manifests and customer receipt."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => notify('Synchronized live carrier telematics data.')}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Truck size={13} />
              <span>Sync Freight Telematics</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Orders List */}
        <div className="col-span-12 lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Active Fulfillment Pipelines ({orders.length})
          </div>

          {orders.map(order => {
            const isSelected = order.id === active.id;
            const currentIdx = stageIndex(order.stage);

            return (
              <div
                key={order.id}
                onClick={() => setSelectedId(order.id)}
                className={`panel p-4 cursor-pointer transition-all border ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{order.orderRef}</span>
                      <StatusPill status={order.stage} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mt-1">{order.customer}</h4>
                    <div className="text-xs text-slate-500 mt-0.5">{order.destination}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">{money(order.amount)}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{order.updatedAt}</div>
                  </div>
                </div>

                {/* Mini Progress Bar */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Truck size={12} className="text-sky-600" />
                    <span>{order.carrier}</span>
                  </div>
                  <span className="font-medium text-slate-700">
                    Stage {currentIdx + 1} of 5 ({order.stage})
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Order Detailed Progress */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SALES ORDER DISPATCH</span>
                <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                  <span>{active.orderRef}</span>
                  <span className="text-sm font-normal text-slate-500">· {active.customer}</span>
                </h3>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <MapPin size={13} className="text-slate-400" />
                  <span>Destination: {active.destination}</span>
                </div>
              </div>
              <div className="text-right">
                <StatusPill status={active.stage} />
                <div className="text-xs font-bold text-slate-900 mt-1.5">{money(active.amount)}</div>
              </div>
            </div>

            {/* 5-Step Visual Tracker */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">Fulfilment Progression</div>
              <div className="grid grid-cols-5 gap-2">
                {stages.map((st, i) => {
                  const currentIdx = stageIndex(active.stage);
                  const isDone = i < currentIdx;
                  const isCurrent = i === currentIdx;

                  return (
                    <div key={st.key} className="space-y-2 text-center">
                      <div
                        className={`h-2 rounded-full transition-colors ${
                          isDone
                            ? 'bg-emerald-500'
                            : isCurrent
                            ? 'bg-sky-600'
                            : 'bg-slate-200'
                        }`}
                      />
                      <div className="text-[11px] font-semibold text-slate-800 leading-tight">
                        {st.label}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isDone ? 'Completed' : isCurrent ? 'Active Now' : 'Pending'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Carrier & Warehouse Details */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Designated Carrier</span>
                  <span className="font-bold text-slate-800">{active.carrier}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Tracking Manifest #</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-sky-700">
                    <span>{active.tracking}</span>
                    <button
                      onClick={() => notify(`Copied tracking number ${active.tracking}`)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Dispatch Origin Facility</span>
                  <span className="font-bold text-slate-800">{active.warehouse}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Estimated Delivery Window</span>
                  <span className="font-bold text-slate-800">{active.estDelivery}</span>
                </div>
              </div>
            </div>

            {/* Hardware Items Package Manifest */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Box size={14} className="text-sky-600" />
                <span>Package Inventory Manifest ({active.itemsCount} SKUs verified)</span>
              </div>
              <div className="text-xs text-slate-600 p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span>1. Enterprise Optical Transceiver Array (100G QSFP28)</span>
                  <span className="font-mono text-slate-500">Qty: 8 · Passed QA</span>
                </div>
                <div className="flex justify-between">
                  <span>2. Dual-redundant PDU Power Distribution Module</span>
                  <span className="font-mono text-slate-500">Qty: 4 · Passed QA</span>
                </div>
                <div className="flex justify-between">
                  <span>3. High-Density Cat6A Structured Trunk Bundle</span>
                  <span className="font-mono text-slate-500">Qty: 2 · Passed QA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-200 mt-6 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Carrier webhooks simulate real-time GPS telemetry updates.
            </div>
            <button
              onClick={() => handleAdvance(active)}
              disabled={active.stage === 'Delivered'}
              className="btn primary text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-50"
            >
              <PackageCheck size={14} />
              <span>Advance to Next Milestone</span>
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="inline-toast">
          <Check size={14} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
