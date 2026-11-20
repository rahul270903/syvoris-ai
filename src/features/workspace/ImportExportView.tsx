import { useState } from 'react';
import {
  FileSpreadsheet, Download, Upload, CheckCircle2,
  AlertCircle, ArrowRight, RefreshCw, FileText, Database,
  Layers, Check, X, Sparkles, Filter, ShieldCheck
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';

export interface TransferJob {
  id: string;
  type: 'Import' | 'Export';
  entity: string;
  fileName: string;
  recordsCount: number;
  format: 'CSV' | 'Excel XLSX' | 'JSON';
  status: 'Completed' | 'In Progress' | 'Failed';
  timestamp: string;
  user: string;
}

const INITIAL_JOBS: TransferJob[] = [
  {
    id: 'TRF-108',
    type: 'Import',
    entity: 'Organizations',
    fileName: 'caribbean_enterprise_accounts_q4.csv',
    recordsCount: 42,
    format: 'CSV',
    status: 'Completed',
    timestamp: 'Today 11:20',
    user: 'Arjun Mehta'
  },
  {
    id: 'TRF-107',
    type: 'Export',
    entity: 'Opportunities / Deals',
    fileName: 'pipeline_q4_forecast_export.xlsx',
    recordsCount: 18,
    format: 'Excel XLSX',
    status: 'Completed',
    timestamp: 'Yesterday 16:45',
    user: 'Sarah Jenkins'
  },
  {
    id: 'TRF-106',
    type: 'Import',
    entity: 'Contacts',
    fileName: 'telecom_executives_directory.csv',
    recordsCount: 115,
    format: 'CSV',
    status: 'Completed',
    timestamp: 'Nov 18, 2026',
    user: 'Elena Rostova'
  },
  {
    id: 'TRF-105',
    type: 'Export',
    entity: 'Product Catalog',
    fileName: 'product_master_pricing_2026.csv',
    recordsCount: 34,
    format: 'CSV',
    status: 'Completed',
    timestamp: 'Nov 15, 2026',
    user: 'Aisha Patel'
  }
];

export function ImportExportView() {
  const { addAudit } = useCRM();
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [jobs, setJobs] = useState<TransferJob[]>(INITIAL_JOBS);
  const [toast, setToast] = useState<string>('');

  // Import State
  const [targetEntity, setTargetEntity] = useState<string>('Organizations');
  const [duplicateStrategy, setDuplicateStrategy] = useState<'update' | 'skip' | 'allow'>('update');
  const [importProgress, setImportProgress] = useState<number | null>(null);

  // Field mapping state
  const [fieldMappings, setFieldMappings] = useState([
    { source: 'Company_Legal_Name', target: 'Organization Name', sample: 'Northstar Logistics Group' },
    { source: 'Work_Email_Address', target: 'Primary Email', sample: 'ops@northstar-logistics.example' },
    { source: 'Annual_Revenue_USD', target: 'Annual Commercial ARR', sample: '$45,000,000' },
    { source: 'Office_Direct_Phone', target: 'Office Phone', sample: '+1 (876) 920-4100' },
    { source: 'Territory_Country', target: 'Jurisdiction / Country', sample: 'Jamaica' }
  ]);

  // Export State
  const [exportEntity, setExportEntity] = useState<string>('Organizations');
  const [exportFormat, setExportFormat] = useState<'CSV' | 'Excel XLSX' | 'JSON'>('CSV');
  const [exporting, setExporting] = useState<boolean>(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleExecuteImport = () => {
    setImportProgress(10);
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev === null) return 10;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setImportProgress(null);
            const newJob: TransferJob = {
              id: `TRF-${Math.floor(100 + Math.random() * 900)}`,
              type: 'Import',
              entity: targetEntity,
              fileName: `bulk_${targetEntity.toLowerCase()}_import.csv`,
              recordsCount: 28,
              format: 'CSV',
              status: 'Completed',
              timestamp: 'Just now',
              user: 'Arjun Mehta'
            };
            setJobs(prevJobs => [newJob, ...prevJobs]);
            notify(`Import completed: 28 records ingested into ${targetEntity} with zero validation errors.`);
            addAudit?.('Data Import Executed', `Imported 28 records into ${targetEntity}`, 'Import / Export');
          }, 400);
          return 100;
        }
        return prev + 30;
      });
    }, 250);
  };

  const handleExecuteExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      // Generate actual downloadable CSV file
      const headers = ['Record_ID', 'Entity_Type', 'Name', 'Commercial_Value', 'Status', 'Updated_Date'];
      const rows = [
        ['REC-2026-001', exportEntity, 'Northstar Logistics Group', '$48,900.00', 'Active', '2026-11-20'],
        ['REC-2026-002', exportEntity, 'Cyberdyne Systems Corp', '$120,000.00', 'Active', '2026-11-20'],
        ['REC-2026-003', exportEntity, 'Fujikura Optical Technologies', '$75,000.00', 'Active', '2026-11-19'],
        ['REC-2026-004', exportEntity, 'Vertex Global Solutions', '$14,200.00', 'Active', '2026-11-18']
      ];
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `syvoris_${exportEntity.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const newJob: TransferJob = {
        id: `TRF-${Math.floor(100 + Math.random() * 900)}`,
        type: 'Export',
        entity: exportEntity,
        fileName: `syvoris_${exportEntity.toLowerCase().replace(/\s+/g, '_')}_export.csv`,
        recordsCount: 4,
        format: exportFormat,
        status: 'Completed',
        timestamp: 'Just now',
        user: 'Arjun Mehta'
      };
      setJobs(prev => [newJob, ...prev]);

      notify(`Export file generated and downloaded: ${newJob.fileName}`);
      addAudit?.('Data Export Generated', `Exported ${exportEntity} dataset`, 'Import / Export');
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <SectionHeading
        eyebrow="ADMINISTRATION / DATA EXCHANGE"
        title="Enterprise Import & Export Control Center"
        subtitle="Perform bulk spreadsheet ingestion with column mapping, export governed CRM records, and inspect file transfer logs."
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">PostgreSQL Direct Engine</span>
          </div>
        }
      />

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Completed Transfers</span>
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{jobs.length} Jobs</div>
          <div className="text-[11px] text-slate-500 mt-1">Ingestion & extraction history</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Total Records Processed</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">12,400 Rows</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Multi-entity synchronized</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Mapping Schema Engine</span>
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">Auto-Match 100%</div>
          <div className="text-[11px] text-slate-500 mt-1">Semantic column detection</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Data Sanitation Status</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">Validated Clean</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Zero SQL injection risk</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'import'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Bulk Data Import Wizard</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'export'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Data Export Studio</span>
        </button>
      </div>

      {activeTab === 'import' ? (
        /* IMPORT WIZARD */
        <div className="space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Interactive CSV / Excel Import Engine</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Map spreadsheet columns to CRM relational fields with automated duplicate deduplication.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Entity:</span>
                <select
                  value={targetEntity}
                  onChange={e => setTargetEntity(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Organizations">Organizations / Accounts</option>
                  <option value="Contacts">Contacts & People</option>
                  <option value="Leads">Inbound Leads</option>
                  <option value="Opportunities">Opportunities & Deals</option>
                  <option value="Products">Product & Services Master</option>
                </select>
              </div>
            </div>

            {/* Field Mapping Matrix */}
            <div>
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Column Mapping Matrix (Auto-Detected from File)
              </div>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-[10px] text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Source Spreadsheet Column</th>
                      <th className="py-2.5 px-2 text-center w-12">➔</th>
                      <th className="py-2.5 px-4">Target CRM Field</th>
                      <th className="py-2.5 px-4">Sample Extracted Value</th>
                      <th className="py-2.5 px-3 text-center">Mapping Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {fieldMappings.map((m, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 font-mono text-cyan-300 font-semibold">{m.source}</td>
                        <td className="py-2.5 px-2 text-center text-slate-500 font-bold">➔</td>
                        <td className="py-2.5 px-4 font-semibold text-white">{m.target}</td>
                        <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{m.sample}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded font-semibold">
                            Matched 100%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Duplicate Handling */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Duplicate Handling Strategy
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {[
                  { id: 'update', label: 'Update Existing Records', desc: 'Overwrites matching emails / keys' },
                  { id: 'skip', label: 'Skip Duplicate Records', desc: 'Preserves existing records intact' },
                  { id: 'allow', label: 'Create as Duplicate Copy', desc: 'Retains all rows without matching' }
                ].map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setDuplicateStrategy(opt.id as any)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      duplicateStrategy === opt.id
                        ? 'bg-cyan-950/50 border-cyan-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Execute Import Action */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Ready to import <strong>28 records</strong> into PostgreSQL tenant partition.
              </span>

              <button
                onClick={handleExecuteImport}
                disabled={importProgress !== null}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-cyan-950/40 flex items-center gap-2 transition-all"
              >
                {importProgress !== null ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing... {importProgress}%</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Execute Bulk Import</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* EXPORT STUDIO */
        <div className="space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg space-y-5">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Data Export Studio</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate validated data exports formatted for external business intelligence tools and data warehouses.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Dataset
                </label>
                <select
                  value={exportEntity}
                  onChange={e => setExportEntity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Organizations">Organizations Master</option>
                  <option value="Opportunities / Deals">Opportunities & Closed Deals</option>
                  <option value="Cases">Customer Service Cases & SLAs</option>
                  <option value="Product Catalog">Product Master & Inventory ATP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Export Format
                </label>
                <div className="flex items-center gap-2">
                  {(['CSV', 'Excel XLSX', 'JSON'] as const).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                        exportFormat === fmt
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Estimated output size: <strong className="text-white">~140 KB</strong> · Instant client-side download
              </span>

              <button
                onClick={handleExecuteExport}
                disabled={exporting}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 transition-all"
              >
                {exporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating File...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Generate & Download File</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historical Transfer Log */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Recent Data Transfer & Ingestion Audit Log</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-3">Transfer Type</th>
                <th className="py-3 px-3">Target Entity</th>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-3">Format</th>
                <th className="py-3 px-3 text-center">Rows</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {jobs.map(j => (
                <tr key={j.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{j.id}</td>
                  <td className="py-3.5 px-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      j.type === 'Import'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                    }`}>
                      {j.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-white">{j.entity}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">{j.fileName}</td>
                  <td className="py-3.5 px-3 text-slate-400">{j.format}</td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-white">{j.recordsCount}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                      {j.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {j.user} · <span className="text-slate-500">{j.timestamp}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
