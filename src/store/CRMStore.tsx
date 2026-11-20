import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { seedData } from '../data/seed';
import { STORAGE_KEY, makeActivity, makeId, prefixFor, type CRMData, type CRMRecord, type DomainEvent } from '../data/models';

type Store = {
  data: CRMData;
  events: DomainEvent[];
  records: (entity: string) => CRMRecord[];
  create: (entity: string, fields: Record<string, string>, options?: Partial<CRMRecord>) => CRMRecord;
  update: (entity: string, id: string, patch: Partial<CRMRecord>, action?: string) => CRMRecord | undefined;
  remove: (entity: string, id: string) => void;
  addToRecycleBin: (item: {
    id: string;
    ref?: string;
    title?: string;
    name?: string;
    entity: string;
    description?: string;
    fields?: Record<string, any>;
    record?: Record<string, any>;
  }) => void;
  restoreFromRecycleBin: (id: string) => void;
  purgeFromRecycleBin: (id: string) => void;
  emptyRecycleBin: () => void;
  addEvent: (type: string, record: CRMRecord | { ref: string }, summary: string, status?: DomainEvent['status']) => void;
  findByRef: (ref: string) => { entity: string; record: CRMRecord } | undefined;
  addAudit: (name: string, actor?: string, details?: string) => void;
  reset: () => void;
};

const StoreContext = createContext<Store | null>(null);

const getActiveTenantSlug = (): string => {
  try {
    return localStorage.getItem('syvoris:active_tenant_slug') || '';
  } catch {
    return '';
  }
};

const getTenantStorageKey = (slug: string): string => {
  return slug ? `syvoris-crm:tenant:${slug}` : STORAGE_KEY;
};

const getBaseData = (): CRMData => {
  return seedData;
};

const loadTenantState = (): { data: CRMData; events: DomainEvent[]; slug: string } => {
  const slug = getActiveTenantSlug();
  const key = getTenantStorageKey(slug);
  const base = getBaseData();

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      const mergedData: CRMData = { ...base };
      if (parsed.data) {
        Object.keys(base).forEach(entityKey => {
          if (Array.isArray(parsed.data[entityKey]) && parsed.data[entityKey].length > 0) {
            mergedData[entityKey] = parsed.data[entityKey];
          }
        });
      }
      return {
        data: mergedData,
        events: parsed.events || [],
        slug
      };
    }
  } catch {
    /* fallback to clean tenant baseline */
  }

  const seededEvents: DomainEvent[] = (seedData.events || []).map(record => ({
    id: record.id,
    type: record.title,
    recordRef: record.fields.entityRef || record.ref,
    summary: record.description,
    at: record.fields.at || record.date,
    actor: record.owner,
    status: record.fields.delivery === 'Failed' ? 'Failed' : 'Published'
  }));

  return { data: base, events: seededEvents, slug };
};

export function CRMProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(loadTenantState, []);
  const [activeSlug, setActiveSlug] = useState<string>(initial.slug);
  const [data, setData] = useState<CRMData>(initial.data);
  const [events, setEvents] = useState<DomainEvent[]>(initial.events);

  // Monitor tenant changes in localStorage
  useEffect(() => {
    const checkTenant = () => {
      const currentSlug = getActiveTenantSlug();
      if (currentSlug !== activeSlug) {
        setActiveSlug(currentSlug);
        const fresh = loadTenantState();
        setData(fresh.data);
        setEvents(fresh.events);
      }
    };
    const interval = setInterval(checkTenant, 1000);
    return () => clearInterval(interval);
  }, [activeSlug]);

  // Persist tenant-specific prototype data
  useEffect(() => {
    const key = getTenantStorageKey(activeSlug);
    // Ensure organizations and contacts are never stored in CRMStore for authenticated tenants
    const toStore = {
      ...data,
      ...(activeSlug ? { organizations: [], contacts: [] } : {})
    };
    try {
      localStorage.setItem(key, JSON.stringify({ data: toStore, events }));
    } catch {
      // quota or private browsing
    }
  }, [data, events, activeSlug]);

  const records = (entity: string) => {
    if (activeSlug && (entity === 'organizations' || entity === 'contacts')) {
      // Authenticated tenants must NEVER read from CRMStore for accounts/contacts
      return [];
    }
    return data[entity] || [];
  };

  const addEvent = (type: string, record: CRMRecord | { ref: string }, summary: string, status: DomainEvent['status'] = 'Published') => {
    const event: DomainEvent = { id: makeId(), type, recordRef: record.ref, summary, at: new Date().toISOString(), actor: 'System', status };
    setEvents(old => [event, ...old].slice(0, 500));
  };

  const addAudit = (name: string, actor = 'System', details = '') => {
    const id = makeId();
    const audit: CRMRecord = {
      id,
      ref: `${prefixFor.audit}-${Date.now().toString().slice(-6)}`,
      title: name,
      status: 'Recorded',
      owner: actor,
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      description: details || name,
      fields: { name, actor, details, timestamp: new Date().toISOString() },
      links: {},
      history: [makeActivity('Audit record generated', details)]
    };
    setData(old => ({ ...old, audit: [audit, ...(old.audit || [])] }));
  };

  const create = (entity: string, fields: Record<string, string>, options: Partial<CRMRecord> = {}) => {
    const sequenceKey = `syvoris-seq:${activeSlug || 'demo'}:${entity}`;
    const count = Math.max((data[entity] || []).length, Number(localStorage.getItem(sequenceKey) || '0')) + 1;
    localStorage.setItem(sequenceKey, String(count));
    const prefix = prefixFor[entity] || 'REC';
    const name = fields.name || fields.account || fields.subject || fields.title || entity;
    const id = makeId();
    const record: CRMRecord = {
      id,
      ref: `${prefix}-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`,
      title: name,
      status: options.status || 'Draft',
      owner: fields.owner || 'User',
      date: fields.date || new Date().toISOString().slice(0, 10),
      amount: Number(fields.amount || fields.value || fields.budget || 0) || 0,
      description: fields.description || fields.notes || fields.scope || `${name} record`,
      fields: { ...fields },
      links: options.links || {},
      history: [makeActivity('Record created')],
      ...options
    };
    setData(old => ({ ...old, [entity]: [record, ...(old[entity] || [])] }));
    addEvent(`${entity}.created`, record, `${record.ref} created`);
    addAudit(`${entity} created`, record.owner, record.ref);
    return record;
  };

  const update = (entity: string, id: string, patch: Partial<CRMRecord>, action = 'Record updated') => {
    const current = (data[entity] || []).find(x => x.id === id);
    if (!current) return undefined;
    const updated: CRMRecord = {
      ...current,
      ...patch,
      fields: patch.fields ? { ...current.fields, ...patch.fields } : current.fields,
      links: patch.links ? { ...current.links, ...patch.links } : current.links,
      history: [...current.history, makeActivity(action, patch.description)]
    };
    setData(old => ({ ...old, [entity]: (old[entity] || []).map(x => x.id === id ? updated : x) }));
    addEvent(`${entity}.updated`, updated, action);
    addAudit(action, 'User', updated.ref);
    return updated;
  };

  const remove = (entity: string, id: string) => {
    const record = (data[entity] || []).find(x => x.id === id);
    if (!record) return;
    const deletedRecord: CRMRecord = {
      ...record,
      status: 'Deleted',
      fields: { ...record.fields, originalEntity: entity },
      history: [...record.history, makeActivity('Moved to recycle bin')]
    };
    setData(old => ({
      ...old,
      [entity]: (old[entity] || []).filter(x => x.id !== id),
      recycleBin: [deletedRecord, ...(old.recycleBin || [])]
    }));
    addAudit(`${entity} moved to recycle bin`, 'User', record.ref);
    addEvent(`${entity}.deleted`, record, `Moved to recycle bin`);
  };

  const addToRecycleBin = (item: {
    id: string;
    ref?: string;
    title?: string;
    name?: string;
    entity: string;
    description?: string;
    fields?: Record<string, any>;
    record?: Record<string, any>;
  }) => {
    const itemRef = item.ref || item.id || `REC-${Math.floor(1000 + Math.random() * 9000)}`;
    const itemTitle = item.title || item.name || itemRef;
    const deletedRecord: CRMRecord = {
      id: item.id,
      ref: itemRef,
      title: itemTitle,
      status: 'Deleted',
      owner: 'Arjun Mehta',
      date: new Date().toISOString().slice(0, 10),
      description: item.description || `Deleted ${item.entity} record`,
      fields: { ...(item.fields || item.record || {}), originalEntity: item.entity },
      links: {},
      history: [makeActivity('Moved to recycle bin')],
      amount: 0
    };
    setData(old => ({
      ...old,
      recycleBin: [deletedRecord, ...(old.recycleBin || [])]
    }));
    addAudit(`${item.entity} moved to recycle bin`, 'User', itemRef);
    addEvent(`${item.entity}.deleted`, { ref: itemRef }, `Moved to recycle bin`);
  };

  const restoreFromRecycleBin = (id: string) => {
    const record = (data.recycleBin || []).find(x => x.id === id);
    if (!record) return;
    const origEntity = record.fields?.originalEntity || '';
    const restoredRecord: CRMRecord = {
      ...record,
      status: 'Active',
      history: [...record.history, makeActivity('Restored from recycle bin')]
    };
    setData(old => ({
      ...old,
      recycleBin: (old.recycleBin || []).filter(x => x.id !== id),
      ...(origEntity && old[origEntity] ? { [origEntity]: [restoredRecord, ...(old[origEntity] || [])] } : {})
    }));
    addAudit(`Record restored from recycle bin`, 'User', record.ref);
    addEvent(`recycleBin.restored`, record, `Restored to ${origEntity || 'workspace'}`);
  };

  const purgeFromRecycleBin = (id: string) => {
    setData(old => ({
      ...old,
      recycleBin: (old.recycleBin || []).filter(x => x.id !== id)
    }));
    addAudit(`Record permanently purged from recycle bin`, 'User', id);
  };

  const emptyRecycleBin = () => {
    setData(old => ({
      ...old,
      recycleBin: []
    }));
    addAudit(`Recycle bin emptied`, 'User', 'ALL');
  };

  const findByRef = (ref: string) => {
    for (const [entity, items] of Object.entries(data)) {
      const record = items.find(x => x.ref === ref || x.id === ref);
      if (record) return { entity, record };
    }
    return undefined;
  };

  const reset = () => {
    const fresh = loadTenantState();
    setData(fresh.data);
    setEvents(fresh.events);
    const key = getTenantStorageKey(activeSlug);
    localStorage.removeItem(key);
  };

  const value: Store = {
    data,
    events,
    records,
    create,
    update,
    remove,
    addToRecycleBin,
    restoreFromRecycleBin,
    purgeFromRecycleBin,
    emptyRecycleBin,
    addEvent,
    findByRef,
    addAudit,
    reset
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useCRM() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useCRM must be used inside CRMProvider');
  return ctx;
}
