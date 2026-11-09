import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, ChevronDown, ChevronLeft, ChevronRight, Command, HelpCircle,
  LayoutDashboard, LogOut, Menu, Search, Settings, ShieldCheck,
  Sparkles, Workflow, X
} from 'lucide-react';
import { navGroups, allNavItems, getNavItem } from './app/navigation';
import { CRMProvider, useCRM } from './store/CRMStore';
import { Dashboard } from './features/dashboard/Dashboard';
import { WorkspacePage } from './features/workspace/WorkspacePage';
import { WorkflowNavigator } from './features/workspace/WorkflowNavigator';
import { AIWorkspace } from './features/ai/AIWorkspace';
import { IntegrationWorkspace } from './features/integrations/IntegrationWorkspace';
import { Login } from './app/Login';
import { StatusPill } from './components/StatusPill';
import { Toast } from './components/Toast';
import type { ToastMessage } from './data/models';

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(['Command Centre', 'Essentials & Customer 360', 'Sales & Revenue']);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [role, setRole] = useState('System Administrator');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { data, records, update, create, addAudit, reset } = useCRM();

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

  const loginOut = () => {
    localStorage.removeItem('syvoris-ai:demo-auth');
    navigate('/login');
    window.location.reload();
  };

  const notifyRole = (newRole: string) => {
    setRole(newRole);
    setProfileOpen(false);
    addAudit('Demo role context switched', newRole, 'UI role selector only; not an authorization boundary.');
    notify(`Demo role context changed to ${newRole}.`, 'info');
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

        <button className="tenant-switcher" onClick={() => notify('Only one demo workspace is configured.', 'info')}>
          <span className="tenant-avatar">SE</span>
          <span>
            <b>Seiretsu Enterprise</b>
            <small>Primary workspace</small>
          </span>
          <ChevronDown size={14} />
        </button>

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
            <span>Prototype v0.1 · Phase 1</span>
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
              <span>Workspace</span>
              <ChevronRight size={13} />
              <strong>{activeItem?.label || (location.pathname === '/dashboard' ? 'Dashboard' : 'Workspace')}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <button className="global-search" onClick={() => setSearchOpen(true)}>
              <Search size={15} />
              <span>Search anything...</span>
              <kbd>
                <Command size={10} /> K
              </kbd>
            </button>

            <div className="environment-indicator">
              <i /> Demo environment
            </div>

            <div className="top-menu-wrap">
              <button
                className={`top-icon ${notificationsOpen ? 'selected' : ''}`}
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                }}
                aria-label="Notifications"
              >
                <Bell size={18} />
                <i className="notif-count">3</i>
              </button>

              {notificationsOpen && (
                <div className="dropdown notification-dropdown">
                  <div className="dropdown-header">
                    <div>
                      <b>Notifications</b>
                      <small>{notifications.length} items need attention</small>
                    </div>
                    <button onClick={() => setNotificationsOpen(false)}>Close</button>
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

            <div className="top-menu-wrap profile-menu">
              <button
                className="profile-trigger"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationsOpen(false);
                }}
              >
                <span className="profile-avatar">DU</span>
                <span>
                  <b>Demo User</b>
                  <small>{role === 'System Administrator' ? 'Enterprise Administrator' : role}</small>
                </span>
                <ChevronDown size={14} />
              </button>

              {profileOpen && (
                <div className="dropdown profile-dropdown">
                  <div className="profile-summary">
                    <span className="profile-avatar large">DU</span>
                    <span>
                      <b>Demo User</b>
                      <small>demo@syvoris.example</small>
                    </span>
                  </div>
                  <label>DEMO ROLE CONTEXT</label>
                  {[
                    'System Administrator',
                    'Sales Manager',
                    'Sales Representative',
                    'Marketing Manager',
                    'Customer Support Agent',
                    'Service Manager',
                    'Executive',
                  ].map(r => (
                    <button key={r} className={role === r ? 'role-selected' : ''} onClick={() => notifyRole(r)}>
                      {r}
                      {role === r && <CheckIcon />}
                    </button>
                  ))}
                  <div className="profile-divider" />
                  <button onClick={() => navigate('/admin/roles')}>
                    <Settings size={14} />
                    Administration settings
                  </button>
                  <button onClick={loginOut}>
                    <LogOut size={14} />
                    Sign out
                  </button>
                  <small className="role-disclaimer">Role switching is a UI simulation, not security enforcement.</small>
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
            <i /> Demo workspace · External services not connected
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
            <div className="search-footer">Global search · module metadata and local demo records</div>
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
                <p>Prototype navigation and workflow guidance.</p>
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
                <b>Prototype boundaries</b>
                <p>Records persist in browser storage. Communication channels, AI inference and external integrations are simulated or marked planned.</p>
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
      <p>This route is not configured in the current SYVORIS Ai prototype.</p>
      <Link to="/dashboard" className="btn primary">
        Return to dashboard
      </Link>
    </div>
  );
}

function AuthenticatedApp() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem('syvoris-ai:demo-auth') === 'true');
  if (!authenticated) {
    return (
      <Login
        onLogin={email => {
          localStorage.setItem('syvoris-ai:demo-auth', 'true');
          localStorage.setItem('syvoris-ai:demo-user', email);
          setAuthenticated(true);
        }}
      />
    );
  }
  return <AppShell />;
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
