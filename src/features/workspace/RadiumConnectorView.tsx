import { useState } from 'react';
import {
  Building2, RefreshCw, Check, ArrowDownUp, ShieldCheck,
  CheckCircle2, AlertCircle, Clock, Database, Globe
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

interface SyncLog {
  id: string;
  time: string;
  entity: string;
  direction: 'Inbound' | 'Outbound' | 'Bidirectional';
  count: number;
  status: 'Success' | 'Warning' | 'Running';
  details: string;
}

const defaultLogs: SyncLog[] = [
  { id: '1', time: '10:14 AM', entity: 'Sales Orders', direction: 'Outbound', count: 12, status: 'Success', details: 'Exported accepted orders to Radium ERP sales ledger.' },
  { id: '2', time: '09:30 AM', entity: 'Inventory Stock', direction: 'Inbound', count: 48, status: 'Success', details: 'Updated warehouse available-to-promise balances.' },
  { id: '3', time: '08:00 AM', entity: 'Invoice Status', direction: 'Inbound', count: 6, status: 'Success', details: 'Reconciled paid status for outstanding receivables.' },
  { id: '4', time: 'Yesterday', entity: 'Customer Master', direction: 'Bidirectional', count: 18, status: 'Success', details: 'Synced corporate tax IDs and credit terms.' },
];

export function RadiumConnectorView() {
  const { addEvent, addAudit } = useCRM();

  const [syncing, setSyncing] = useState(false);
  const [logs, setLogs] = useState<SyncLog[]>(defaultLogs);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const handleTriggerSync = () => {
    setSyncing(true);
    notify('Initiating bidirectional sync with Radium ERP bridge...');

    setTimeout(() => {
      const newLog: SyncLog = {
        id: String(Date.now()),
        time: 'Just now',
        entity: 'All Core Entities',
        direction: 'Bidirectional',
        count: 24,
        status: 'Success',
        details: 'Full delta sync completed: 6 orders exported, 18 stock records refreshed.',
      };
      setLogs(prev => [newLog, ...prev]);
      setSyncing(false);
      addEvent('integration.radium_synced', { ref: 'RADIUM-BRIDGE-1' }, 'Bidirectional sync successfully completed');
      addAudit('Radium ERP Sync Triggered', 'Demo User', 'Full reconciliation pipeline');
      notify('Radium ERP sync completed successfully (24 records updated).');
    }, 1800);
  };

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="INTEGRATION & EVENT LAYER / ERP BRIDGE"
        title="Radium ERP Enterprise Connector"
        subtitle="Manage bidirectional synchronization between SYVORIS Ai CRM and Radium ERP financial & inventory engines."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerSync}
              disabled={syncing}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3 disabled:opacity-50"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Syncing...' : 'Sync All Entities Now'}</span>
            </button>
          </div>
        }
      />

      {/* Architecture Boundary Strip */}
      <div className="demo-strip">
        <span className="demo-strip-icon">
          <ShieldCheck size={18} />
        </span>
        <div>
          <strong>Architectural Separation: SYVORIS Ai & Radium ERP</strong>
          <p>
            SYVORIS Ai operates as an independent CRM and revenue operations platform. Radium ERP is modeled strictly across documented integration boundaries (REST/JSON, event webhooks) with zero codebase coupling.
          </p>
        </div>
      </div>

      {/* Bridge Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="panel p-4">
          <div className="text-xs text-slate-500 font-medium">Bridge Status</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active & Healthy</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">mTLS 1.3 encrypted tunnel</div>
        </div>

        <div className="panel p-4">
          <div className="text-xs text-slate-500 font-medium">API Latency</div>
          <div className="text-xl font-bold text-slate-900 mt-1">38 ms</div>
          <div className="text-[11px] text-slate-400 mt-1">99.99% uptime this month</div>
        </div>

        <div className="panel p-4">
          <div className="text-xs text-slate-500 font-medium">Last Sync Run</div>
          <div className="text-xl font-bold text-slate-900 mt-1">12 mins ago</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">0 error count</div>
        </div>

        <div className="panel p-4">
          <div className="text-xs text-slate-500 font-medium">Synced Entities</div>
          <div className="text-xl font-bold text-slate-900 mt-1">1,420 Records</div>
          <div className="text-[11px] text-slate-400 mt-1">Orders, stock & invoices</div>
        </div>
      </div>

      {/* Entity Mapping Table */}
      <div className="panel overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Entity Synchronization Mapping</h3>
            <p className="text-xs text-slate-500">Domain mapping and directional authority between CRM and ERP.</p>
          </div>
          <StatusPill status="Configured" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">SYVORIS Ai (CRM)</th>
                <th className="py-2.5 px-4">Direction</th>
                <th className="py-2.5 px-4">Radium ERP Entity</th>
                <th className="py-2.5 px-4">System of Record</th>
                <th className="py-2.5 px-4">Sync Frequency</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-bold text-slate-900">Organizations / Customers</td>
                <td className="py-3 px-4 text-sky-600 font-semibold">↔ Bidirectional</td>
                <td className="py-3 px-4 font-mono">AR_CUSTOMER_MASTER</td>
                <td className="py-3 px-4">SYVORIS Ai (Commercial)</td>
                <td className="py-3 px-4">Near Real-Time (Event)</td>
                <td className="py-3 px-4"><StatusPill status="Active" /></td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-bold text-slate-900">Sales Orders (Accepted)</td>
                <td className="py-3 px-4 text-indigo-600 font-semibold">→ Outbound</td>
                <td className="py-3 px-4 font-mono">OE_SALES_ORDER_HEADER</td>
                <td className="py-3 px-4">SYVORIS Ai (Origin)</td>
                <td className="py-3 px-4">Immediate on Acceptance</td>
                <td className="py-3 px-4"><StatusPill status="Active" /></td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-bold text-slate-900">Products & Inventory Stock</td>
                <td className="py-3 px-4 text-purple-600 font-semibold">← Inbound</td>
                <td className="py-3 px-4 font-mono">INV_ITEM_BALANCES</td>
                <td className="py-3 px-4">Radium ERP (Authority)</td>
                <td className="py-3 px-4">Every 15 Minutes</td>
                <td className="py-3 px-4"><StatusPill status="Active" /></td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-bold text-slate-900">Invoices & Payment Receipts</td>
                <td className="py-3 px-4 text-purple-600 font-semibold">← Inbound</td>
                <td className="py-3 px-4 font-mono">AR_INVOICE_PAYMENT</td>
                <td className="py-3 px-4">Radium ERP (Ledger)</td>
                <td className="py-3 px-4">Hourly Cadence</td>
                <td className="py-3 px-4"><StatusPill status="Active" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Execution Event Log */}
      <div className="panel overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Integration Sync Telemetry Log</h3>
            <p className="text-xs text-slate-500">Live transaction stream between SYVORIS and Radium ERP.</p>
          </div>
          <button
            onClick={() => notify('Refreshed telemetry logs from integration bridge.')}
            className="btn secondary text-xs py-1 px-3 flex items-center gap-1"
          >
            <RefreshCw size={12} />
            <span>Refresh Logs</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {logs.map(log => (
            <div key={log.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                  <Database size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.entity}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                      {log.direction}
                    </span>
                    <StatusPill status={log.status} />
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{log.details}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-semibold text-slate-700">{log.count} records</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{log.time}</div>
              </div>
            </div>
          ))}
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
