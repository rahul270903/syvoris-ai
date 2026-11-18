import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, ChevronDown, ChevronLeft, ChevronRight, Command, HelpCircle,
  LayoutDashboard, LogOut, Menu, Search, Settings, ShieldCheck,
  Sparkles, Workflow, X, Plus, Target, Briefcase, FileCheck2,
  LifeBuoy, CheckSquare, Building2, Check, ArrowUpRight, Zap
} from 'lucide-react';
import { navGroups, allNavItems, getNavItem } from './app/navigation';
import { CRMProvider, useCRM } from './store/CRMStore';
import { Dashboard } from './features/dashboard/Dashboard';
import { WorkspacePage } from './features/workspace/WorkspacePage';
import { WorkflowNavigator } from './features/workspace/WorkflowNavigator';
import { AIWorkspace } from './features/ai/AIWorkspace';
import { IntegrationWorkspace } from './features/integrations/IntegrationWorkspace';
import { BillingWorkspace } from './features/billing/BillingWorkspace';
import { Login } from './app/Login';
import { Register } from './app/Register';
import { api, CurrentUserProfile } from './services/api';
import { StatusPill } from './components/StatusPill';
import { Toast } from './components/Toast';
import type { ToastMessage } from './data/models';

interface AppShellProps {
  initialProfile: CurrentUserProfile;
  onLogout: () => void;
}

function AppShell({ initialProfile, onLogout }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(['Command Centre', 'Essentials & Customer 360', 'Sales & Revenue']);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [userProfile, setUserProfile] = useState<CurrentUserProfile>(initialProfile);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { data, records, update, create, addAudit, reset } = useCRM();

  const switchOrg = async (tenantId: string) => {
    try {
      await api.switchTenant(tenantId);
      const updated = await api.getMe();
      setUserProfile(updated);
      notify(`Switched organization to ${updated.active_tenant?.tenant_name}.`, 'success');
    } catch (err: any) {
      notify(err.message || 'Failed to switch organization context.', 'error');
    }
    setTenantDropdownOpen(false);
  };

  const notify = (text: string, tone: ToastMessage['tone'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(old => [...old, { id, text, tone }]);
    window.setTimeout(() => setToasts(old => old.filter(x => x.id !== id)), 4500);
  };

  const activeItem = getNavItem(location.pathname);
  const activeGroup = navGroups.find(g => g.items.some(i => i.path === location.pathname));

  useEffect(() => {
    if (activeGroup && !expanded.includes(activeGroup.label)) {
      setExpanded(old => [...old, activeGroup.label]);
    }
    setMobileOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setQuickCreateOpen(false);
    setTelemetryOpen(false);
    setTenantDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
        setQuickCreateOpen(false);
        setTelemetryOpen(false);
        setTenantDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  const searchResults = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return [];
    const fromRecords = Object.entries(data).flatMap(([entity, items]) =>
      items
        .filter(r => `${r.ref} ${r.title} ${r.description} ${Object.values(r.fields).join(' ')}`.toLowerCase().includes(q))
        .map(record => ({ entity, record }))
    ).slice(0, 8);
    const fromModules = allNavItems
      .filter(i => `${i.label} ${i.description}`.toLowerCase().includes(q))
      .slice(0, 6)
      .map(item => ({ item }));
    return [...fromModules, ...fromRecords];
  }, [data, search]);

  const resultPath = (entity: string) =>
    ({
      organizations: '/organizations',
      contacts: '/contacts',
      leads: '/leads',
      opportunities: '/opportunities',
      quotes: '/quotes',
      salesOrders: '/sales-orders',
      invoices: '/invoices',
      cases: '/cases',
      projects: '/projects',
      tasks: '/tasks',
      campaigns: '/campaigns',
      agents: '/ai/agents',
      decisions: '/ai/activity',
      interactions: '/activities',
      products: '/catalog/products',
      services: '/catalog/services',
      documents: '/documents',
      knowledge: '/knowledge',
      events: '/integrations/events',
      audit: '/admin/audit',
      integrations: '/integrations',
      vendors: '/catalog/vendors',
      milestones: '/projects/milestones',
      resources: '/projects/resources',
      surveys: '/service/feedback',
      segments: '/segments',
      priceBooks: '/price-books',
      roles: '/admin/roles',
      teams: '/admin/teams',
      users: '/admin/users',
      slaPolicies: '/service/sla',
      workflows: '/admin/workflows',
      leadSources: '/lead-sources',
      scenarios: '/ai/revenue-twin',
    }[entity] || '/dashboard');

  const notifications = [
    ...records('decisions').filter(x => x.status === 'Pending Approval').map(x => ({
      id: x.id,
      path: '/approvals',
      title: 'Approval required',
      body: `${x.ref} · ${x.title}`,
      time: 'Requires review',
    })),
    ...records('cases').filter(x => x.fields.priority === 'High' && !['Resolved', 'Closed'].includes(x.status)).map(x => ({
      id: x.id,
      path: '/cases',
      title: 'High-priority service case',
      body: `${x.ref} · ${x.title}`,
      time: 'Service queue',
    })),
    ...records('tasks').filter(x => x.status !== 'Completed').slice(0, 2).map(x => ({
      id: x.id,
      path: '/tasks',
      title: 'Task reminder',
      body: `${x.ref} · ${x.title}`,
      time: x.fields.dueDate || 'Open task',
    })),
  ];

  const toggleGroup = (label: string) =>
    setExpanded(old => (old.includes(label) ? old.filter(x => x !== label) : [...old, label]));

  const loginOut = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    api.clearTokens();
    onLogout();
  };

  return (
    <div className={`app-frame ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

      {/* Enterprise Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div
          className="sidebar-brand"
          onClick={collapsed ? () => setCollapsed(false) : undefined}
          title={collapsed ? 'Click to expand sidebar' : undefined}
          style={collapsed ? { cursor: 'pointer' } : undefined}
        >
          <Link
            to="/dashboard"
            className="brand-link"
            onClick={e => {
              if (collapsed) {
                e.preventDefault();
                setCollapsed(false);
              }
            }}
          >
            <div className="brand-icon-box">
              <img src="/assets/syvoris-mark-transparent.svg" alt="SYVORIS Ai" />
            </div>
            <span className="brand-name">
              SYVORIS <b>Ai</b>
              <small>ENTERPRISE PLATFORM</small>
            </span>
          </Link>
          <button
            className="collapse-button"
            onClick={e => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            title={collapsed ? 'Maximize sidebar' : 'Minimize sidebar'}
            aria-label={collapsed ? 'Maximize sidebar' : 'Minimize sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className="relative">
          <button
            className="tenant-switcher w-full text-left"
            onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
          >
            <span className="tenant-avatar">
              {userProfile?.active_tenant?.tenant_name ? userProfile.active_tenant.tenant_name.slice(0, 2).toUpperCase() : 'BP'}
            </span>
            <span>
              <b>{userProfile?.active_tenant?.tenant_name || 'BluePeak Innovations'}</b>
              <small>{userProfile?.active_tenant?.tenant_slug ? `${userProfile.active_tenant.tenant_slug}` : 'bluepeak-innovations'}</small>
            </span>
            <ChevronDown size={14} />
          </button>

          {tenantDropdownOpen && (
            <div className="tenant-dropdown">
              <label>
                <span>ORGANIZATION WORKSPACES</span>
                <span className="text-emerald-400 font-bold lowercase">active</span>
              </label>
              {(userProfile?.memberships && userProfile.memberships.length > 0) ? (
                userProfile.memberships.map(m => (
                  <button
                    key={m.tenant_id}
                    className={userProfile.active_tenant?.tenant_id === m.tenant_id ? 'role-selected' : ''}
                    onClick={() => switchOrg(m.tenant_id)}
                  >
                    <span>
                      <b>{m.tenant_name}</b>
                      <small>{m.role} · {m.status}</small>
                    </span>
                    {userProfile.active_tenant?.tenant_id === m.tenant_id && <ShieldCheck size={14} className="text-emerald-400" />}
                  </button>
                ))
              ) : (
                <button className="role-selected">
                  <span>
                    <b>{userProfile?.active_tenant?.tenant_name || 'BluePeak Innovations'}</b>
                    <small>Tenant Owner · Active</small>
                  </span>
                  <ShieldCheck size={14} className="text-emerald-400" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="side-nav-scroll">
          <div className="nav-section-label">WORKSPACE</div>
          <Link to="/dashboard" className={`nav-dashboard ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/workflows/lifecycle"
            className={`nav-dashboard workflow-nav-link ${location.pathname === '/workflows/lifecycle' ? 'active' : ''}`}
          >
            <Workflow size={17} />
            <span>Workflow Navigator</span>
          </Link>

          <div className="nav-section-label module-label">BUSINESS MODULES</div>
          {navGroups
            .filter(g => g.label !== 'Command Centre')
            .map(group => {
              const open = expanded.includes(group.label);
              const GIcon = group.icon;
              const current = group.items.some(i => i.path === location.pathname);
              return (
                <div className={`nav-group ${current ? 'current-group' : ''}`} key={group.label}>
                  <button
                    className={`nav-group-button ${open ? 'open' : ''}`}
                    onClick={() => {
                      if (collapsed) {
                        setCollapsed(false);
                        setExpanded([group.label]);
                      } else {
                        toggleGroup(group.label);
                      }
                    }}
                  >
                    <GIcon size={17} />
                    <span>{group.label}</span>
                    <small>{group.items.length}</small>
                    <ChevronDown size={13} />
                  </button>
                  {open && (
                    <div className="nav-subitems">
                      {group.items.map(item => {
                        const I = item.icon;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            title={item.label}
                            className={`nav-subitem ${location.pathname === item.path ? 'active' : ''}`}
                          >
                            <span className="nav-child-dot" />
                            <I size={14} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="sidebar-bottom">
          <button onClick={() => setShowHelp(true)}>
            <HelpCircle size={16} />
            <span>Help centre</span>
          </button>
          <div className="sidebar-status">
            <i />
            <span>Enterprise v2.4 · Live</span>
          </div>
        </div>
      </aside>

      {/* Main App Shell */}
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <Menu size={18} />
            </button>
            <div className="breadcrumbs">
              <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Workspace</Link>
              <ChevronRight size={13} className="text-slate-400" />
              <strong>{activeItem?.label || (location.pathname === '/dashboard' ? 'Executive Dashboard' : 'Workspace')}</strong>
              {activeGroup && (
                <span className="hidden xl:inline-flex items-center text-[10.5px] font-medium text-slate-500 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md ml-1">
                  {activeGroup.label}
                </span>
              )}
            </div>
          </div>

          <div className="topbar-right">
            {/* Quick Action: + New Record Dropdown */}
            <div className="top-menu-wrap">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                onClick={() => {
                  setQuickCreateOpen(!quickCreateOpen);
                  setNotificationsOpen(false);
                  setProfileOpen(false);
                  setTelemetryOpen(false);
                }}
              >
                <Plus size={15} />
                <span>New</span>
                <ChevronDown size={13} className={`transition-transform ${quickCreateOpen ? 'rotate-180' : ''}`} />
              </button>

              {quickCreateOpen && (
                <div className="dropdown shadow-xl border border-slate-200 rounded-xl bg-white w-56 p-1.5" style={{ right: 0, top: 'calc(100% + 8px)' }}>
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Quick Create Record
                  </div>
                  {[
                    { label: 'New Lead', icon: Target, path: '/leads', color: 'text-blue-600 bg-blue-50' },
                    { label: 'New Opportunity', icon: Briefcase, path: '/opportunities', color: 'text-indigo-600 bg-indigo-50' },
                    { label: 'New Commercial Quote', icon: FileCheck2, path: '/quotes/builder', color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'New Support Case', icon: LifeBuoy, path: '/cases', color: 'text-amber-600 bg-amber-50' },
                    { label: 'New Assigned Task', icon: CheckSquare, path: '/tasks', color: 'text-purple-600 bg-purple-50' },
                    { label: 'New Organization', icon: Building2, path: '/organizations', color: 'text-cyan-600 bg-cyan-50' },
                  ].map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.path}
                        onClick={() => {
                          setQuickCreateOpen(false);
                          navigate(opt.path);
                        }}
                        className="flex items-center gap-2.5 w-full p-2 text-left rounded-lg hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                      >
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center flex-none ${opt.color}`}>
                          <Icon size={13} />
                        </span>
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Copilot Quick Trigger */}
            <button
              onClick={() => navigate('/ai/copilot')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:border-blue-300 transition-all shadow-2xs"
              title="Open SYVORIS Ai Assistant"
            >
              <Sparkles size={14} className="text-blue-600 animate-pulse" />
              <span>Ask AI</span>
            </button>

            {/* Global Search Bar */}
            <button className="global-search" onClick={() => setSearchOpen(true)}>
              <Search size={15} />
              <span>Search anything...</span>
              <kbd>
                <Command size={10} /> K
              </kbd>
            </button>

            {/* Live System Telemetry Status (Replaces wireframe Demo environment) */}
            <div className="top-menu-wrap">
              <button
                className="environment-indicator flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50/70 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                onClick={() => {
                  setTelemetryOpen(!telemetryOpen);
                  setQuickCreateOpen(false);
                  setNotificationsOpen(false);
                  setProfileOpen(false);
                }}
                title="Real-time multi-tenant platform telemetry"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Enterprise Cloud</span>
              </button>

              {telemetryOpen && (
                <div className="dropdown shadow-xl border border-slate-200 rounded-xl bg-white w-80 p-4 text-left" style={{ right: 0, top: 'calc(100% + 8px)' }}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                    <div>
                      <b className="text-xs text-slate-900 block">System Telemetry & Health</b>
                      <small className="text-[10px] text-slate-400">Multi-tenant runtime monitor</small>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ALL HEALTHY
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Active Tenant</span>
                      <span className="font-semibold text-slate-800">{userProfile.active_tenant?.tenant_name || 'BluePeak Innovations'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Database Engine</span>
                      <span className="font-semibold text-slate-800">PostgreSQL 16 · Kernel RLS</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Radium ERP Bridge</span>
                      <span className="font-semibold text-emerald-600">Connected (38ms)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Autonomous Agents</span>
                      <span className="font-semibold text-slate-800">14 Active & Governed</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Security Invariant</span>
                      <span className="font-semibold text-slate-800">SOC2 Type II / TLS 1.3</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => { setTelemetryOpen(false); navigate('/integrations/radium'); }}
                      className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Inspect ERP Bridge</span>
                      <ArrowUpRight size={13} />
                    </button>
                    <button
                      onClick={() => { setTelemetryOpen(false); navigate('/admin/audit'); }}
                      className="text-xs text-slate-500 font-medium hover:underline"
                    >
                      Audit Trail
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Menu */}
            <div className="top-menu-wrap">
              <button
                className={`top-icon ${notificationsOpen ? 'selected' : ''}`}
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                  setQuickCreateOpen(false);
                  setTelemetryOpen(false);
                }}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadNotifications > 0 && <i className="notif-count">{unreadNotifications}</i>}
              </button>

              {notificationsOpen && (
                <div className="dropdown notification-dropdown">
                  <div className="dropdown-header">
                    <div>
                      <b>Notifications</b>
                      <small>{notifications.length} items need attention</small>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadNotifications > 0 && (
                        <button
                          onClick={() => {
                            setUnreadNotifications(0);
                            notify('All notifications marked as read.');
                          }}
                          className="text-[11px] text-blue-600 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setNotificationsOpen(false)}>Close</button>
                    </div>
                  </div>
                  {notifications.slice(0, 7).map(n => (
                    <button
                      className="notification-item"
                      key={n.id}
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate(n.path);
                      }}
                    >
                      <span className="notification-icon">
                        <Bell size={14} />
                      </span>
                      <span>
                        <b>{n.title}</b>
                        <small>{n.body}</small>
                        <em>{n.time}</em>
                      </span>
                    </button>
                  ))}
                  {notifications.length === 0 && <div className="dropdown-empty">You&apos;re all caught up.</div>}
                  <div
                    className="dropdown-footer"
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate('/approvals');
                    }}
                  >
                    Open approval queue <ChevronRight size={14} />
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Trigger & Menu */}
            <div className="top-menu-wrap profile-menu">
              <button
                className="profile-trigger"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationsOpen(false);
                  setQuickCreateOpen(false);
                  setTelemetryOpen(false);
                }}
              >
                <span className="profile-avatar">
                  {userProfile.user ? `${userProfile.user.first_name[0] || 'A'}${userProfile.user.last_name[0] || 'M'}` : 'AM'}
                </span>
                <span>
                  <b>{userProfile.user?.full_name || 'Arjun Mehta'}</b>
                  <small>{userProfile.active_tenant?.role || 'Tenant Owner'}</small>
                </span>
                <ChevronDown size={14} />
              </button>

              {profileOpen && (
                <div className="dropdown profile-dropdown">
                  <div className="profile-summary">
                    <span className="profile-avatar large">
                      {userProfile.user ? `${userProfile.user.first_name[0] || 'A'}${userProfile.user.last_name[0] || 'M'}` : 'AM'}
                    </span>
                    <span>
                      <b>{userProfile.user?.full_name || 'Arjun Mehta'}</b>
                      <small>{userProfile.user?.email || 'arjun.mehta@bluepeak.example'}</small>
                    </span>
                  </div>
                  <label>ASSIGNED ORGANIZATION ROLE</label>
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg mb-2">
                    <div className="font-bold text-cyan-400 text-sm">{userProfile.active_tenant?.role || 'Tenant Owner'}</div>
                    <div className="text-slate-400 text-xs mt-1">
                      {userProfile.active_tenant?.permissions?.length || 32} active platform permissions
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Enforced by PostgreSQL RLS & RBAC policies
                    </div>
                  </div>
                  <div className="profile-divider" />
                  <button onClick={() => { setProfileOpen(false); navigate('/customers/preferences'); }}>
                    <Settings size={14} />
                    User preferences & profile
                  </button>
                  <button onClick={() => { setProfileOpen(false); navigate('/admin/roles'); }}>
                    <ShieldCheck size={14} />
                    Administration & security roles
                  </button>
                  <button onClick={() => { setProfileOpen(false); navigate('/admin/audit'); }}>
                    <Workflow size={14} />
                    Immutable audit logs
                  </button>
                  <div className="profile-divider" />
                  <button onClick={loginOut} className="text-rose-600 hover:text-rose-700">
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/workflows/lifecycle" element={<WorkflowNavigator />} />
            {allNavItems
              .filter(i => i.path.startsWith('/ai'))
              .map(i => (
                <Route key={i.path} path={i.path} element={<AIWorkspace path={i.path} title={i.label} description={i.description} />} />
              ))}
            {allNavItems
              .filter(i => i.path.startsWith('/integrations'))
              .map(i => (
                <Route key={i.path} path={i.path} element={<IntegrationWorkspace path={i.path} title={i.label} description={i.description} />} />
              ))}
            <Route path="/billing" element={<BillingWorkspace />} />
            <Route path="/billing/subscriptions" element={<BillingWorkspace />} />
            <Route path="/analytics/pipeline" element={<Navigate to="/sales/pipeline" replace />} />
            <Route path="/analytics/expenses" element={<Navigate to="/purchase-orders" replace />} />
            <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
            {allNavItems
              .filter(i => !i.path.startsWith('/ai') && !i.path.startsWith('/integrations') && i.path !== '/workflows/lifecycle')
              .map(i => (
                <Route key={i.path} path={i.path} element={<WorkspacePage item={i} />} />
              ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <span>© 2026 SYVORIS Ai™ · Enterprise Platform, CRM, Sales & Operations</span>
          <span>
            <i style={{ background: '#10b981' }} /> Connected: {userProfile.active_tenant?.tenant_name || 'Active Tenant'} ({userProfile.active_tenant?.role || 'Member'}) · PostgreSQL Core Active
          </span>
        </footer>
      </div>

      {searchOpen && (
        <div className="search-overlay" onMouseDown={e => e.target === e.currentTarget && setSearchOpen(false)}>
          <div className="search-modal">
            <div className="search-input-row">
              <Search size={18} />
              <input
                autoFocus
                placeholder="Search modules, customers, leads, opportunities..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <kbd>ESC</kbd>
              <button onClick={() => setSearchOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="search-results">
              {searchResults.length === 0 ? (
                <div className="search-start">
                  <Sparkles size={24} />
                  <b>Search SYVORIS Ai</b>
                  <span>Find a workspace, customer, opportunity, lead or record.</span>
                </div>
              ) : (
                searchResults.map((r: any, i: number) =>
                  r.item ? (
                    <button
                      key={`m-${r.item.path}`}
                      onClick={() => {
                        navigate(r.item.path);
                        setSearchOpen(false);
                        setSearch('');
                      }}
                    >
                      <span className="search-result-icon">
                        <r.item.icon size={16} />
                      </span>
                      <span>
                        <b>{r.item.label}</b>
                        <small>Workspace · {r.item.category}</small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  ) : (
                    <button
                      key={`r-${r.record.id}`}
                      onClick={() => {
                        navigate(resultPath(r.entity), { state: { openRecordId: r.record.id } });
                        setSearchOpen(false);
                        setSearch('');
                      }}
                    >
                      <span className="search-result-icon">
                        <Search size={16} />
                      </span>
                      <span>
                        <b>{r.record.title}</b>
                        <small>
                          {r.record.ref} · {r.entity}
                        </small>
                      </span>
                      <StatusPill status={r.record.status} />
                    </button>
                  )
                )
              )}
            </div>
            <div className="search-footer">Global search · customer records, modules, and platform data</div>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setShowHelp(false)}>
          <aside className="detail-panel narrow">
            <div className="detail-head">
              <div>
                <span className="eyebrow">SYVORIS Ai SUPPORT</span>
                <h2>Help centre</h2>
                <p>Operational navigation and workflow guidance.</p>
              </div>
              <button className="icon-close" onClick={() => setShowHelp(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="detail-scroll">
              <div className="help-card">
                <Sparkles size={18} />
                <b>Getting started</b>
                <p>Use the sidebar to open each workspace. Select a record to see details and actions. Use Ctrl/Cmd + K for global search.</p>
              </div>
              <div className="help-card">
                <ShieldCheck size={18} />
                <b>Platform Architecture & Governance</b>
                <p>Enterprise multi-tenant data layer backed by PostgreSQL Row-Level Security, Redis cache, Radium ERP sync bridge, and 14 autonomous AI specialist agents.</p>
              </div>
              <button
                className="btn primary full"
                onClick={() => {
                  setShowHelp(false);
                  navigate('/workflows/lifecycle');
                }}
              >
                Open workflow navigator <ChevronRight size={15} />
              </button>
            </div>
          </aside>
        </div>
      )}

      <Toast items={toasts} onDismiss={id => setToasts(old => old.filter(t => t.id !== id))} />
    </div>
  );
}

function CheckIcon() {
  return <span className="check-mark">✓</span>;
}

function NotFound() {
  return (
    <div className="not-found panel">
      <div className="not-found-mark">404</div>
      <h1>Workspace not found</h1>
      <p>This workspace route is not available or has been moved. Explore active CRM modules via the sidebar or return to the command dashboard.</p>
      <Link to="/dashboard" className="btn primary">
        Return to dashboard
      </Link>
    </div>
  );
}

function AuthenticatedApp() {
  const [userProfile, setUserProfile] = useState<CurrentUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  const checkSession = async () => {
    try {
      const p = await api.getMe();
      setUserProfile(p);
    } catch {
      api.clearTokens();
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();

    const handleExpired = () => {
      setUserProfile(null);
    };
    window.addEventListener('syvoris:session_expired', handleExpired);
    return () => window.removeEventListener('syvoris:session_expired', handleExpired);
  }, []);

  if (loading) {
    return (
      <div className="login-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ color: '#06b6d4', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>SYVORIS Ai</div>
          <p style={{ fontSize: 12 }}>Authenticating enterprise workspace...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    if (authView === 'register') {
      return (
        <Register
          onSuccess={() => checkSession()}
          onNavigateLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <Login
        onLogin={() => checkSession()}
        onNavigateRegister={() => setAuthView('register')}
      />
    );
  }

  return <AppShell initialProfile={userProfile} onLogout={() => setUserProfile(null)} />;
}

export default function App() {
  return (
    <CRMProvider>
      <BrowserRouter>
        <AuthenticatedApp />
      </BrowserRouter>
    </CRMProvider>
  );
}
