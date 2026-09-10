import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';
import {
  LayoutDashboard, Users, Package, FileText,
  ShoppingCart, LogOut, Menu, X,
  Zap, Building2
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
    roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
  },
  {
    path: '/customers',
    label: 'Customers',
    icon: <Users size={18} />,
    roles: ['ADMIN', 'SALES', 'ACCOUNTS'],
  },
  {
    path: '/products',
    label: 'Products & Stock',
    icon: <Package size={18} />,
    roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
  },
  {
    path: '/challans',
    label: 'Sales Challans',
    icon: <FileText size={18} />,
    roles: ['ADMIN', 'SALES', 'ACCOUNTS'],
  },
  {
    path: '/users',
    label: 'Users',
    icon: <ShoppingCart size={18} />,
    roles: ['ADMIN'],
  },
];

const roleColors: Record<Role, string> = {
  ADMIN: '#6366f1',
  SALES: '#10b981',
  WAREHOUSE: '#f59e0b',
  ACCOUNTS: '#3b82f6',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const visibleNav = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const pageTitle = navItems.find((item) =>
    location.pathname.startsWith(item.path)
  )?.label ?? 'Portal';

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99, display: 'none',
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={20} color="white" />
          </div>
          <div>
            <div className="sidebar-logo-text">ERP+CRM</div>
            <div className="sidebar-logo-sub">Operations Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {visibleNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={logout}>
            <div
              className="user-avatar"
              style={{ background: `linear-gradient(135deg, ${roleColors[user?.role ?? 'ADMIN']}cc, ${roleColors[user?.role ?? 'ADMIN']})` }}
            >
              {user ? getInitials(user.name ?? user.email) : '?'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name ?? user?.email}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <LogOut size={15} style={{ color: 'var(--color-text-dim)', flexShrink: 0 }} />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: 'none' }}
            id="sidebar-toggle"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-3">
            <Building2 size={18} style={{ color: 'var(--color-text-dim)' }} />
            <div>
              <div className="topbar-title">{pageTitle}</div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div className="flex items-center gap-3">
            <div
              className="badge"
              style={{
                background: `${roleColors[user?.role ?? 'ADMIN']}20`,
                color: roleColors[user?.role ?? 'ADMIN'],
              }}
            >
              {user?.role}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
