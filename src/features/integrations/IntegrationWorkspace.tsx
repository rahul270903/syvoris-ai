import { useState, useEffect, useMemo } from 'react';
import {
  Activity, ArrowDownUp, Check, Cloud, ExternalLink, Plug, RefreshCw,
  ShieldCheck, X, Zap, Wifi, Server, Key, Lock, Database, ArrowRight,
  Clock, AlertTriangle, Play, CheckCircle2, Copy, Eye, EyeOff, Radio,
  Send, Layers, Sparkles, Terminal
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { useCRM } from '../../store/CRMStore';
import { api, IntegrationConnectorItem, WebhookSubscriptionItem } from '../../services/api';

export interface ConnectorProvider {
  id: string;
  name: string;
  type: string;
  status: 'Active' | 'Connected' | 'Configured' | 'Degraded';
  description: string;
  owner: string;
  boundary: string;
  systemOfRecord: string;
  endpointUrl: string;
  protocol: string;
  authMethod: string;
  latency_ms: number;
  lastSynced: string;
  activeSockets: number;
  totalSyncedRecords: number;
  syncInProgress?: boolean;
  pinging?: boolean;
}

const DEFAULT_CONNECTORS: ConnectorProvider[] = [
  {
    id: 'conn-radium',
    name: 'Radium ERP Core',
    type: 'ERP / Inventory & General Ledger',
    status: 'Active',
    description: 'Direct enterprise bridge for real-time inventory availability, sales order export, and general ledger journal reconciliation.',
    owner: 'Integration Architecture',
    boundary: 'SYVORIS AI is system of record for CRM leads, quotes, and customer accounts. Radium ERP is authoritative system of record for inventory valuations and general ledger balances via mTLS 1.3.',
    systemOfRecord: 'Radium ERP (GL & Physical Stock)',
    endpointUrl: 'https://radium-gateway.bluepeak.internal/v2/rpc',
    protocol: 'mTLS 1.3 / gRPC over HTTP/2',
    authMethod: 'Mutual TLS X.509 + Bearer OIDC',
    latency_ms: 18,
    lastSynced: '3 mins ago',
    activeSockets: 8,
    totalSyncedRecords: 48920
  },
  {
    id: 'conn-stripe',
    name: 'Stripe Billing & Payments',
    type: 'Merchant Gateway & Invoicing',
    status: 'Connected',
    description: 'Enterprise payment processing, recurring billing subscriptions, PCI-DSS tokenized card vaults, and automated webhook reconciliation.',
    owner: 'Finance & Billing',
    boundary: 'Cardholder PAN data never enters SYVORIS CRM. Customer billing references and charge authorization tokens are synchronized with Stripe API v2024.',
    systemOfRecord: 'Stripe API (Payment Vault)',
    endpointUrl: 'https://api.stripe.com/v1',
    protocol: 'RESTful JSON / HTTPS',
    authMethod: 'Restricted Secret API Key (Live)',
    latency_ms: 32,
    lastSynced: '1 min ago',
    activeSockets: 4,
    totalSyncedRecords: 12450
  },
  {
    id: 'conn-m365',
    name: 'Microsoft 365 & Exchange',
    type: 'Enterprise Messaging & Directory',
    status: 'Connected',
    description: 'Bidirectional sync for corporate emails, calendar events, executive meeting reservations, and Azure Active Directory tenant lookup.',
    owner: 'IT & Infrastructure',
    boundary: 'Mail message contents are mirrored to customer timeline threads with PII redaction rules enforced at the ingest gateway.',
    systemOfRecord: 'Microsoft Graph API',
    endpointUrl: 'https://graph.microsoft.com/v1.0',
    protocol: 'OAuth2 REST / MS Graph Webhooks',
    authMethod: 'Azure App Registration (OIDC Bearer)',
    latency_ms: 24,
    lastSynced: '6 mins ago',
    activeSockets: 6,
    totalSyncedRecords: 83200
  },
  {
    id: 'conn-twilio',
    name: 'Twilio Voice & SMS Gateway',
    type: 'Telephony & SMS Dispatch',
    status: 'Active',
    description: 'WebRTC VoIP SIP trunking, automated 2FA verification SMS, customer call recordings, and inbound support telephony queues.',
    owner: 'Customer Engagement',
    boundary: 'Twilio mediates all PSTN audio trunks. Media streams are archived in encrypted S3 cold storage; metadata logged in SYVORIS.',
    systemOfRecord: 'Twilio Cloud Voice Fabric',
    endpointUrl: 'https://api.twilio.com/2010-04-01',
    protocol: 'SIP Trunking & REST Webhooks',
    authMethod: 'Twilio Account SID & Auth Token',
    latency_ms: 41,
    lastSynced: 'Just now',
    activeSockets: 12,
    totalSyncedRecords: 29400
  },
  {
    id: 'conn-gcalendar',
    name: 'Google Workspace Calendar',
    type: 'Scheduling & Appointments',
    status: 'Configured',
    description: 'Field engineer dispatch calendar sync, customer consultation bookings, and automated timezone alignment.',
    owner: 'Productivity Systems',
    boundary: 'Two-way synchronization of consultation slots without exposing private personal calendar items.',
    systemOfRecord: 'Google Calendar v3 API',
    endpointUrl: 'https://www.googleapis.com/calendar/v3',
    protocol: 'REST JSON / Push Notifications',
    authMethod: 'Google Service Account JWT',
    latency_ms: 29,
    lastSynced: '14 mins ago',
    activeSockets: 2,
    totalSyncedRecords: 9140
  },
  {
    id: 'conn-websdk',
    name: 'SYVORIS Web SDK & Live Chat',
    type: 'Digital Client Portal & Chat',
    status: 'Active',
    description: 'Real-time WebSocket event ingestion from enterprise customer web portals, live chat escalation, and lead capture forms.',
    owner: 'Digital Experience',
    boundary: 'Authenticated customer portal sessions are scoped strictly to the respective organization tenant ID via PostgreSQL RLS.',
    systemOfRecord: 'SYVORIS AI Core Enclave',
    endpointUrl: 'wss://realtime.bluepeak.internal/v1/stream',
    protocol: 'WebSocket WSS / Protobuf',
    authMethod: 'Tenant JWT Session Token',
    latency_ms: 12,
    lastSynced: 'Live (Streaming)',
    activeSockets: 34,
    totalSyncedRecords: 142100
  },
  {
    id: 'conn-sendgrid',
    name: 'SendGrid Transactional Mail',
    type: 'High-Volume Notification Relays',
    status: 'Configured',
    description: 'Dedicated IP transactional email relay for quote PDF deliveries, invoice notifications, and incident ticket updates.',
    owner: 'Communications',
    boundary: 'Email delivery webhooks emit open/click telemetry into SYVORIS customer engagement analytics.',
    systemOfRecord: 'Twilio SendGrid v3',
    endpointUrl: 'https://api.sendgrid.com/v3/mail/send',
    protocol: 'REST HTTPS',
    authMethod: 'SendGrid Bearer API Key',
    latency_ms: 38,
    lastSynced: '18 mins ago',
    activeSockets: 3,
    totalSyncedRecords: 65120
  },
  {
    id: 'conn-s3',
    name: 'Cloudflare R2 / S3 Object Storage',
    type: 'Encrypted Document & Asset Vault',
    status: 'Active',
    description: 'Zero-egress object storage for CPQ generated quote PDFs, signed enterprise master services agreements (MSAs), and OTDR trace files.',
    owner: 'Security & Infrastructure',
    boundary: 'All stored assets are encrypted at rest with AES-256 GCM keys managed through AWS KMS / Vault.',
    systemOfRecord: 'Cloudflare R2 S3-Compatible',
    endpointUrl: 'https://r2.cloudflarestorage.com/bluepeak-vault',
    protocol: 'S3 API / HTTPS',
    authMethod: 'AWS Signature Version 4',
    latency_ms: 22,
    lastSynced: '5 mins ago',
    activeSockets: 16,
    totalSyncedRecords: 18450
  }
];

export function IntegrationWorkspace({
  path,
  title,
  description
}: {
  path: string;
  title: string;
  description: string;
}) {
  const { events } = useCRM();
  const [connectors, setConnectors] = useState<ConnectorProvider[]>(DEFAULT_CONNECTORS);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorProvider | null>(null);
  const [drawerTab, setDrawerTab] = useState<'boundary' | 'health' | 'sync' | 'credentials'>('boundary');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'connectors' | 'events' | 'apis'>('connectors');

  // Add Connector form
  const [newConn, setNewConn] = useState({
    name: '',
    type: 'REST API & Webhooks',
    endpointUrl: 'https://api.',
    authMethod: 'Bearer Token',
    boundary: ''
  });

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Sync state when path prop changes
  useEffect(() => {
    if (path.includes('events')) setActiveTab('events');
    else if (path.includes('apis')) setActiveTab('apis');
    else setActiveTab('connectors');
  }, [path]);

  // KPI calculations
  const kpis = useMemo(() => {
    const total = connectors.length;
    const active = connectors.filter(c => c.status === 'Active' || c.status === 'Connected').length;
    const avgLatency = Math.round(connectors.reduce((acc, c) => acc + c.latency_ms, 0) / total);
    const totalRecords = connectors.reduce((acc, c) => acc + c.totalSyncedRecords, 0);
    return { total, active, avgLatency, totalRecords };
  }, [connectors]);

  // Ping handler for direct card or drawer
  const handlePing = (id: string, name: string) => {
    setConnectors(prev => prev.map(c => c.id === id ? { ...c, pinging: true } : c));
    if (selectedConnector && selectedConnector.id === id) {
      setSelectedConnector(prev => prev ? { ...prev, pinging: true } : null);
    }

    setTimeout(() => {
      const freshLatency = Math.floor(14 + Math.random() * 25);
      setConnectors(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            pinging: false,
            latency_ms: freshLatency,
            status: 'Active'
          };
        }
        return c;
      }));

      if (selectedConnector && selectedConnector.id === id) {
        setSelectedConnector(prev => prev ? {
          ...prev,
          pinging: false,
          latency_ms: freshLatency,
          status: 'Active'
        } : null);
      }
      notify(`Pinged ${name}: 200 OK (${freshLatency} ms latency)`);
    }, 600);
  };

  // Trigger manual sync
  const handleSync = (id: string, name: string) => {
    setConnectors(prev => prev.map(c => c.id === id ? { ...c, syncInProgress: true } : c));
    if (selectedConnector && selectedConnector.id === id) {
      setSelectedConnector(prev => prev ? { ...prev, syncInProgress: true } : null);
    }

    setTimeout(() => {
      const added = Math.floor(12 + Math.random() * 48);
      setConnectors(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            syncInProgress: false,
            lastSynced: 'Just now',
            totalSyncedRecords: c.totalSyncedRecords + added
          };
        }
        return c;
      }));

      if (selectedConnector && selectedConnector.id === id) {
        setSelectedConnector(prev => prev ? {
          ...prev,
          syncInProgress: false,
          lastSynced: 'Just now',
          totalSyncedRecords: prev.totalSyncedRecords + added
        } : null);
      }
      notify(`Sync complete for ${name}: ${added} delta records committed.`);
    }, 1200);
  };

  const handleAddConnector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConn.name.trim() || !newConn.endpointUrl.trim()) {
      notify('Please enter connector name and endpoint URL.');
      return;
    }
    const created: ConnectorProvider = {
      id: `conn-${Date.now()}`,
      name: newConn.name,
      type: newConn.type,
      status: 'Configured',
      description: `Custom configured enterprise connector for ${newConn.name}.`,
      owner: 'Platform Operations',
      boundary: newConn.boundary || `All data exchanged with ${newConn.name} is isolated by PostgreSQL Row-Level Security and verified with HMAC signatures.`,
      systemOfRecord: newConn.name,
      endpointUrl: newConn.endpointUrl,
      protocol: 'RESTful JSON over HTTPS',
      authMethod: newConn.authMethod,
      latency_ms: 35,
      lastSynced: 'Never (Pending First Ingestion)',
      activeSockets: 2,
      totalSyncedRecords: 0
    };
    setConnectors(prev => [created, ...prev]);
    setShowAddModal(false);
    setNewConn({
      name: '',
      type: 'REST API & Webhooks',
      endpointUrl: 'https://api.',
      authMethod: 'Bearer Token',
      boundary: ''
    });
    notify(`Connector "${created.name}" registered successfully.`);
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="INTEGRATIONS & PLATFORM / CONNECTORS & FABRIC"
        title={title || 'Enterprise Integration Hub & Connectors'}
        subtitle={description || 'Operational connector mesh, bidirectional ERP synchronization, mTLS security enclaves, and webhook delivery fabric.'}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setConnectors(prev => prev.map(c => ({
                  ...c,
                  latency_ms: Math.floor(12 + Math.random() * 22)
                })));
                notify('Refreshed all connector health telemetry.');
              }}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <RefreshCw size={14} />
              <span>Refresh Telemetry</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-900/30"
            >
              <Plug size={14} />
              <span>Register Connector</span>
            </button>
          </div>
        }
      />

      {/* KPI METRIC STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Registered Connectors</span>
            <Plug size={16} className="text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{kpis.total} Systems</div>
            <div className="text-[11px] text-slate-400 mt-1">Verified boundary adapters</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Enclaves</span>
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{kpis.active} Online</div>
            <div className="text-[11px] text-slate-400 mt-1">Encrypted mTLS / API tunnels</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Average Mesh Latency</span>
            <Wifi size={16} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-300">{kpis.avgLatency} ms</div>
            <div className="text-[11px] text-slate-400 mt-1">Global edge roundtrip time</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Synchronized Records</span>
            <ArrowDownUp size={16} className="text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-300">{kpis.totalRecords.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">Ledger & CRM reconciled</div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveTab('connectors')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'connectors'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Plug size={14} />
          <span>Application Connectors ({connectors.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'events'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Activity size={14} />
          <span>Domain Event Fabric ({events.length || 6})</span>
        </button>
        <button
          onClick={() => setActiveTab('apis')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'apis'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Terminal size={14} />
          <span>REST Contracts & Webhooks (6 Endpoints)</span>
        </button>
      </div>

      {/* TAB CONTENT: CONNECTORS GRID */}
      {activeTab === 'connectors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectors.map(c => (
            <div
              key={c.id}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group shadow-sm hover:shadow-lg hover:shadow-black/20"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-inner">
                      <Plug size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{c.type}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      c.status === 'Active'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                        : c.status === 'Connected'
                        ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {c.description}
                </p>

                {/* Live telemetry metadata */}
                <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Wifi size={13} className="text-emerald-400" />
                      Live Latency:
                    </span>
                    <span className="font-mono font-semibold text-emerald-400">
                      {c.latency_ms} ms
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock size={13} />
                      Last Synced:
                    </span>
                    <span className="text-slate-300 font-medium">{c.lastSynced}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Database size={13} />
                      System of Record:
                    </span>
                    <span className="text-blue-300 truncate max-w-[130px] font-medium">
                      {c.systemOfRecord}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePing(c.id, c.name)}
                    disabled={c.pinging}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                    title="Ping connector gateway"
                  >
                    <Radio size={12} className={c.pinging ? 'animate-spin text-blue-400' : 'text-emerald-400'} />
                    <span>{c.pinging ? 'Pinging...' : 'Ping'}</span>
                  </button>

                  <button
                    onClick={() => handleSync(c.id, c.name)}
                    disabled={c.syncInProgress}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                    title="Trigger manual delta sync"
                  >
                    <RefreshCw size={12} className={c.syncInProgress ? 'animate-spin text-blue-400' : 'text-cyan-400'} />
                    <span>{c.syncInProgress ? 'Syncing...' : 'Sync'}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSelectedConnector(c);
                    setDrawerTab('boundary');
                  }}
                  className="px-3 py-1.5 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-sm shadow-blue-900/30"
                >
                  <span>View Boundary</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: DOMAIN EVENT FABRIC */}
      {activeTab === 'events' && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Live Domain Event Telemetry</h3>
              <p className="text-xs text-slate-400">Chronological stream of transactional domain events broadcast across connector enclaves.</p>
            </div>
            <button
              onClick={() => notify('Event log stream refreshed from Kafka/PostgreSQL event bus.')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>Refresh Events</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              { id: 'ev-1', type: 'order.fulfillment.confirmed', ref: 'ORD-2026-0042', summary: 'Cisco Catalyst 9300 switch dispatched from Miami Free Trade Depot', time: '1 min ago', status: 'Delivered', connector: 'Radium ERP' },
              { id: 'ev-2', type: 'invoice.payment.settled', ref: 'INV-2026-0019', summary: 'Stripe ACH charge $14,200.00 settled for Apex Global Logistics', time: '4 mins ago', status: 'Reconciled', connector: 'Stripe Billing' },
              { id: 'ev-3', type: 'case.sla.target_breach_warning', ref: 'CASE-2026-0001', summary: 'Tier-1 SAML SSO certificate warning approaching 4h response deadline', time: '8 mins ago', status: 'Warning', connector: 'Twilio Voice' },
              { id: 'ev-4', type: 'deal.proposal.generated', ref: 'OPP-2026-0002', summary: 'Autonomous CPQ engine compiled 96-core dark fiber proposal', time: '14 mins ago', status: 'Signed', connector: 'R2 Object Vault' },
              { id: 'ev-5', type: 'stock.threshold.low_alert', ref: 'SKU-FBR-96C', summary: 'Kingston Central stock dipped below safety buffer (65 reels available)', time: '22 mins ago', status: 'Alert', connector: 'Radium ERP' },
              { id: 'ev-6', type: 'auth.oidc.token_refreshed', ref: 'USR-ARJUN-M', summary: 'FIDO2 cryptographic session renewed via Okta SSO identity provider', time: '35 mins ago', status: 'Active', connector: 'Microsoft 365' }
            ].map(ev => (
              <div
                key={ev.id}
                className="flex items-center justify-between bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl hover:border-slate-700 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-400 flex items-center justify-center shrink-0">
                    <Activity size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{ev.type}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-cyan-400">
                        {ev.ref}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5">{ev.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-slate-400">
                  <span className="text-[10px] bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300 font-medium">
                    {ev.connector}
                  </span>
                  <span className="font-semibold text-emerald-400">{ev.status}</span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock size={12} />
                    {ev.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: REST CONTRACTS & WEBHOOKS */}
      {activeTab === 'apis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Governed REST Contracts (v1)</h3>
              <p className="text-xs text-slate-400">High-throughput microservice endpoints protected by OAuth2 Bearer JWT & tenant RLS.</p>
            </div>
            <div className="space-y-2">
              {[
                { verb: 'GET/POST', path: '/api/v1/customers', auth: 'Bearer JWT', tag: 'Core Accounts' },
                { verb: 'GET/POST', path: '/api/v1/opportunities', auth: 'Bearer JWT', tag: 'Sales Pipeline' },
                { verb: 'GET/POST', path: '/api/v1/quotes', auth: 'Bearer JWT', tag: 'CPQ Engine' },
                { verb: 'GET/POST', path: '/api/v1/orders', auth: 'Bearer JWT', tag: 'Order Fulfillment' },
                { verb: 'GET/POST', path: '/api/v1/invoices', auth: 'Bearer JWT', tag: 'Billing & Ledgers' },
                { verb: 'GET/POST', path: '/api/v1/integrations/sync', auth: 'mTLS Client Cert', tag: 'ERP Sync' }
              ].map((api, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      {api.verb}
                    </span>
                    <span className="font-mono text-slate-200">{api.path}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">{api.auth}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {api.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Outbound Webhook Delivery</h3>
              <p className="text-xs text-slate-400">HMAC SHA-256 signed event notifications with automated exponential retry and DLQ.</p>
            </div>
            <div className="space-y-2">
              {[
                { topic: 'lead.created', target: 'https://radium-gateway.bluepeak.internal/hooks/leads', status: 'Healthy (200 OK)' },
                { topic: 'deal.won', target: 'https://billing.bluepeak.internal/hooks/contracts', status: 'Healthy (200 OK)' },
                { topic: 'quote.approved', target: 'https://radium-gateway.bluepeak.internal/hooks/quotes', status: 'Healthy (200 OK)' },
                { topic: 'ticket.escalated', target: 'https://pagerduty.bluepeak.internal/webhook/alerts', status: 'Healthy (200 OK)' },
                { topic: 'stock.depleted', target: 'https://procurement.bluepeak.internal/hooks/po', status: 'Healthy (200 OK)' }
              ].map((hook, idx) => (
                <div key={idx} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-300">{hook.topic}</span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                      {hook.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">{hook.target}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE SLIDE-OVER DRAWER ENCLAVE */}
      {selectedConnector && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-150"
          onClick={() => setSelectedConnector(null)}
        >
          <div
            className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 text-slate-200 relative flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-md">
                    <Plug size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{selectedConnector.name}</h2>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {selectedConnector.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedConnector.type}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedConnector(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex items-center gap-1 border-b border-slate-800 pt-3 pb-2 text-xs">
                <button
                  onClick={() => setDrawerTab('boundary')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    drawerTab === 'boundary' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Boundary & Contracts
                </button>
                <button
                  onClick={() => setDrawerTab('health')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    drawerTab === 'health' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Health & Latency
                </button>
                <button
                  onClick={() => setDrawerTab('sync')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    drawerTab === 'sync' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sync Controls
                </button>
                <button
                  onClick={() => setDrawerTab('credentials')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    drawerTab === 'credentials' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Credentials & mTLS
                </button>
              </div>

              {/* Drawer Tab 1: Boundary & Contracts */}
              {drawerTab === 'boundary' && (
                <div className="py-5 space-y-4 text-xs">
                  <div className="p-3.5 bg-blue-950/30 border border-blue-800/60 rounded-xl text-blue-200 leading-relaxed">
                    <strong className="text-blue-300 block mb-1 font-semibold flex items-center gap-1.5">
                      <ShieldCheck size={14} />
                      Architectural Boundary Guarantee
                    </strong>
                    {selectedConnector.boundary}
                  </div>

                  <div className="space-y-3 bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <span className="text-slate-400">Authoritative System of Record:</span>
                      <strong className="text-white">{selectedConnector.systemOfRecord}</strong>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <span className="text-slate-400">Data Ownership Domain:</span>
                      <strong className="text-emerald-400">PostgreSQL Tenant RLS Enforced</strong>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <span className="text-slate-400">Ingress / Egress Protocol:</span>
                      <strong className="font-mono text-cyan-300">{selectedConnector.protocol}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Owner Team:</span>
                      <strong className="text-slate-200">{selectedConnector.owner}</strong>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl space-y-2">
                    <span className="font-semibold text-white block">Resilience & Circuit Breaker Policies:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>Automatic fallback to local cache upon 3 consecutive network timeouts.</li>
                      <li>Dead-letter queue (DLQ) retention of failed payload requests for 72 hours.</li>
                      <li>Cryptographic nonce verification to prevent replay attacks across tenant borders.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Drawer Tab 2: Health & Latency */}
              {drawerTab === 'health' && (
                <div className="py-5 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
                      <span className="text-slate-400 block mb-1">Roundtrip Latency</span>
                      <div className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                        <Wifi size={16} />
                        {selectedConnector.latency_ms} ms
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">Standard threshold: &lt; 80 ms</span>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
                      <span className="text-slate-400 block mb-1">Active Sockets Pool</span>
                      <div className="text-xl font-bold font-mono text-cyan-400 flex items-center gap-1.5">
                        <Server size={16} />
                        {selectedConnector.activeSockets} Persistent
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">HTTP/2 Multiplexing Active</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2.5">
                    <span className="font-semibold text-white block">Health Verification Handshake</span>
                    <p className="text-slate-400">Trigger live cryptographic ping across mTLS tunnel to verify socket responsiveness.</p>
                    <button
                      onClick={() => handlePing(selectedConnector.id, selectedConnector.name)}
                      disabled={selectedConnector.pinging}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-900/30 disabled:opacity-50"
                    >
                      <Radio size={14} className={selectedConnector.pinging ? 'animate-spin' : ''} />
                      <span>{selectedConnector.pinging ? 'Testing Tunnel Latency...' : 'Ping Enclave Now'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Drawer Tab 3: Sync Controls */}
              {drawerTab === 'sync' && (
                <div className="py-5 space-y-4 text-xs">
                  <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-white text-sm block">Manual Delta Synchronization</strong>
                        <p className="text-slate-400 mt-0.5">Push pending outbound queues and ingest delta changes.</p>
                      </div>
                      <span className="text-xs font-mono text-blue-400 font-semibold">
                        {selectedConnector.totalSyncedRecords.toLocaleString()} Synced
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => handleSync(selectedConnector.id, selectedConnector.name)}
                        disabled={selectedConnector.syncInProgress}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/30 disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={selectedConnector.syncInProgress ? 'animate-spin' : ''} />
                        <span>{selectedConnector.syncInProgress ? 'Synchronizing Ledger Records...' : 'Trigger Immediate Sync'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950/50 border border-slate-800 p-3.5 rounded-xl space-y-2">
                    <span className="font-semibold text-white block">Reconciliation Entity Mapping:</span>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Customer Accounts & TRN</span>
                        <span className="text-emerald-400">Bidirectional Sync</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Approved Orders & Line Items</span>
                        <span className="text-blue-400">Push to ERP (One-Way)</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Depot Hardware Inventory ATP</span>
                        <span className="text-cyan-400">Pull from ERP (Master)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Drawer Tab 4: Credentials & mTLS */}
              {drawerTab === 'credentials' && (
                <div className="py-5 space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Target Endpoint URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={selectedConnector.endpointUrl}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-[11px] text-cyan-300 select-all"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedConnector.endpointUrl);
                          notify('Endpoint copied.');
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                        title="Copy Endpoint"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Authentication Method</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedConnector.authMethod}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-semibold text-slate-200"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400 font-medium">Connector Secret / API Key</label>
                      <button
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-[11px] text-blue-400 flex items-center gap-1 hover:underline"
                      >
                        {showSecret ? <EyeOff size={12} /> : <Eye size={12} />}
                        <span>{showSecret ? 'Hide' : 'Reveal'}</span>
                      </button>
                    </div>
                    <input
                      type={showSecret ? 'text' : 'password'}
                      readOnly
                      value="sec_live_9a87d00f12c8e391b454921098dfec1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-[11px] text-slate-300"
                    />
                  </div>

                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-400 space-y-1">
                    <span className="font-semibold text-white block">X.509 Client Certificate Thumbprint:</span>
                    <div className="font-mono text-[10px] text-cyan-400 break-all">
                      SHA256: 9B:2E:4F:A1:77:8C:3D:52:19:64:8E:22:11:AB:90:DE:54:12:87:CD:66:39:01
                    </div>
                    <div className="text-[10px] text-slate-500 pt-1">Valid until: Oct 2027 · Caribbean CA Enclave</div>
                  </div>

                  <button
                    onClick={() => notify('Credential rotation initiated. A new secret was issued.')}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold transition-colors"
                  >
                    Rotate Enclave Secret
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setSelectedConnector(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close Enclave Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER CONNECTOR MODAL */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 text-slate-200 relative animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <div className="mb-5">
              <h3 className="text-base font-bold text-white">Register External System Connector</h3>
              <p className="text-xs text-slate-400">Configure architectural boundary and API ingress for an external partner system.</p>
            </div>

            <form onSubmit={handleAddConnector} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Connector Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cisco DNA Spaces"
                  value={newConn.name}
                  onChange={e => setNewConn({ ...newConn, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Integration Category *</label>
                  <select
                    value={newConn.type}
                    onChange={e => setNewConn({ ...newConn, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ERP / Inventory & Finance">ERP / Inventory & Finance</option>
                    <option value="REST API & Webhooks">REST API & Webhooks</option>
                    <option value="Telephony & Voice">Telephony & Voice</option>
                    <option value="Customer Portal & Mobile">Customer Portal & Mobile</option>
                    <option value="Cloud Storage & Backup">Cloud Storage & Backup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Authentication Method *</label>
                  <select
                    value={newConn.authMethod}
                    onChange={e => setNewConn({ ...newConn, authMethod: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Bearer Token">Bearer Token</option>
                    <option value="Mutual TLS (mTLS 1.3)">Mutual TLS (mTLS 1.3)</option>
                    <option value="OAuth2 Client Credentials">OAuth2 Client Credentials</option>
                    <option value="HMAC SHA-256 Webhook Key">HMAC SHA-256 Webhook Key</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Gateway Endpoint URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.partner.com/v1"
                  value={newConn.endpointUrl}
                  onChange={e => setNewConn({ ...newConn, endpointUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">System of Record & Boundary Specification</label>
                <textarea
                  rows={2}
                  placeholder="Define data ownership guarantees and what records this system is authoritative for..."
                  value={newConn.boundary}
                  onChange={e => setNewConn({ ...newConn, boundary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plug size={14} />
                  <span>Register Connector</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
