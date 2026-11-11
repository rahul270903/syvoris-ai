import { useState, useRef, useEffect, useMemo } from 'react';
import { Building2, Search, ChevronDown, Check, X, Loader2, AlertCircle } from 'lucide-react';
import type { AccountItem } from '../../services/api';

interface OrganizationSelectFieldProps {
  label?: string;
  required?: boolean;
  value?: string; // Account UUID or ''
  organizationName?: string; // Fallback display name
  accounts: AccountItem[];
  loading: boolean;
  error?: string | null;
  disabled?: boolean;
  onChange: (accountId: string, accountName: string) => void;
  onRefresh?: () => void;
}

export function OrganizationSelectField({
  label = 'Organization / Account',
  required = false,
  value = '',
  organizationName = '',
  accounts,
  loading,
  error,
  disabled = false,
  onChange,
  onRefresh,
}: OrganizationSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Focus search input on open
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  const selectedAccount = useMemo(() => {
    if (!value) return null;
    return accounts.find(a => a.id === value) || null;
  }, [accounts, value]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      a =>
        a.name.toLowerCase().includes(q) ||
        a.ref.toLowerCase().includes(q) ||
        (a.industry && a.industry.toLowerCase().includes(q))
    );
  }, [accounts, search]);

  const displayName = selectedAccount?.name || organizationName || '';
  const displayRef = selectedAccount?.ref || '';
  const displayIndustry = selectedAccount?.industry || '';

  return (
    <div className="org-select-container" ref={containerRef} style={{ position: 'relative', minWidth: 0 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, color: '#596e87', fontSize: 11, fontWeight: 700 }}>
        <span>
          {label}
          {required && <em style={{ color: '#cf6b5f', fontStyle: 'normal' }}> *</em>}
        </span>

        {/* Trigger Button */}
        <div
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          tabIndex={disabled || loading ? -1 : 0}
          onClick={() => {
            if (!disabled && !loading) {
              setOpen(!open);
            }
          }}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled && !loading) {
              e.preventDefault();
              setOpen(!open);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 34,
            padding: '6px 9px',
            border: error ? '1px solid #f87171' : open ? '1px solid #8eb7e5' : '1px solid #e1e8f0',
            borderRadius: 6,
            background: disabled ? '#f8fafc' : '#ffffff',
            cursor: disabled || loading ? 'not-allowed' : 'pointer',
            boxShadow: open ? '0 0 0 3px rgba(47,116,194,.09)' : 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden', flex: 1, minWidth: 0 }}>
            <Building2 size={14} style={{ color: value ? '#0284c7' : '#94a3b8', flexShrink: 0 }} />
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 11 }}>
                <Loader2 size={13} className="animate-spin" /> Loading organizations...
              </span>
            ) : error ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#dc2626', fontSize: 11 }}>
                <AlertCircle size={13} /> Error loading organizations
              </span>
            ) : value ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <strong style={{ color: '#1e293b', fontSize: 12, fontWeight: 600 }}>{displayName}</strong>
                {displayRef && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: '#e0f2fe',
                      color: '#0369a1',
                      padding: '1px 5px',
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  >
                    {displayRef}
                  </span>
                )}
                {displayIndustry && (
                  <span style={{ fontSize: 10, color: '#64748b', flexShrink: 0 }}>· {displayIndustry}</span>
                )}
              </div>
            ) : (
              <span style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>
                -- No organization (Unassigned) --
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {value && !disabled && (
              <button
                type="button"
                title="Clear organization assignment"
                onClick={e => {
                  e.stopPropagation();
                  onChange('', '');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 2,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={13} />
              </button>
            )}
            <ChevronDown size={14} style={{ color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </div>
        </div>
      </label>

      {/* Dropdown Menu */}
      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.18), 0 4px 10px -2px rgba(15, 23, 42, 0.08)',
            maxHeight: 280,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.12s ease-out',
          }}
        >
          {/* Search Box */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, ref, or industry..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 11,
                color: '#1e293b',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: 4 }}>
            {/* Unassigned Option */}
            <div
              role="option"
              aria-selected={!value}
              onClick={() => {
                onChange('', '');
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                borderRadius: 5,
                cursor: 'pointer',
                background: !value ? '#f0fdf4' : 'transparent',
                color: !value ? '#15803d' : '#64748b',
                fontSize: 11,
                fontWeight: !value ? 600 : 400,
                borderBottom: '1px solid #f8fafc',
              }}
              onMouseEnter={e => {
                if (value) e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={e => {
                if (value) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontStyle: 'italic' }}>-- No organization (Unassigned) --</span>
              </div>
              {!value && <Check size={14} style={{ color: '#16a34a' }} />}
            </div>

            {/* Error or Empty State */}
            {error && (
              <div style={{ padding: '10px 12px', fontSize: 11, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={14} />
                <span>{error}</span>
                {onRefresh && (
                  <button
                    type="button"
                    onClick={onRefresh}
                    style={{ marginLeft: 'auto', textDecoration: 'underline', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {!error && accounts.length === 0 && !loading && (
              <div style={{ padding: '12px 14px', fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: 500 }}>No organizations found for this tenant.</p>
                <p style={{ margin: '4px 0 0', fontSize: 10, color: '#94a3b8' }}>
                  Create an organization first, or leave this contact unassigned.
                </p>
              </div>
            )}

            {!error && accounts.length > 0 && filtered.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
                No organizations matching &ldquo;{search}&rdquo;
              </div>
            )}

            {/* List of Accounts */}
            {filtered.map(acc => {
              const isSelected = acc.id === value;
              return (
                <div
                  key={acc.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(acc.id, acc.name);
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 5,
                    cursor: 'pointer',
                    background: isSelected ? '#eff6ff' : 'transparent',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ color: isSelected ? '#1d4ed8' : '#1e293b', fontSize: 12, fontWeight: 600 }}>
                        {acc.name}
                      </strong>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '1px 4px',
                          borderRadius: 3,
                        }}
                      >
                        {acc.ref}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#64748b' }}>
                      {acc.industry && <span>{acc.industry}</span>}
                      {acc.industry && acc.account_type && <span>·</span>}
                      {acc.account_type && <span>{acc.account_type}</span>}
                      {acc.status && (
                        <span style={{ color: acc.status === 'Active' ? '#16a34a' : '#94a3b8' }}>
                          · {acc.status}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check size={14} style={{ color: '#2563eb', flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div style={{ padding: '6px 10px', borderTop: '1px solid #f1f5f9', background: '#fafafa', fontSize: 9.5, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
            <span>Tenant-scoped PostgreSQL records</span>
            <span>{accounts.length} organizations</span>
          </div>
        </div>
      )}
    </div>
  );
}
