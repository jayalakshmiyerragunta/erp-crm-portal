import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api';
import type { DashboardStats, Challan, Product } from '../../types';
import {
  Users, Package, FileText, TrendingUp,
  AlertTriangle, CheckCircle, Clock, XCircle
} from 'lucide-react';
import { format } from 'date-fns';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'badge-warning',
    CONFIRMED: 'badge-success',
    CANCELLED: 'badge-danger',
    ACTIVE: 'badge-success',
    LEAD: 'badge-info',
    INACTIVE: 'badge-neutral',
  };
  return `badge ${map[status] ?? 'badge-neutral'}`;
};

const statusIcon = (status: string) => {
  if (status === 'CONFIRMED') return <CheckCircle size={12} />;
  if (status === 'CANCELLED') return <XCircle size={12} />;
  return <Clock size={12} />;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getStats()
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner spinner-lg" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Customers',
      value: stats?.customers.total ?? 0,
      sub: `${stats?.customers.active ?? 0} active`,
      icon: <Users size={22} />,
      link: '/customers',
    },
    {
      label: 'Products',
      value: stats?.products.total ?? 0,
      sub: `${stats?.products.lowStock ?? 0} low stock`,
      icon: <Package size={22} />,
      link: '/products',
    },
    {
      label: 'Total Challans',
      value: stats?.challans.total ?? 0,
      sub: `${stats?.challans.confirmed ?? 0} confirmed`,
      icon: <FileText size={22} />,
      link: '/challans',
    },
    {
      label: 'Draft Challans',
      value: stats?.challans.draft ?? 0,
      sub: 'Pending confirmation',
      icon: <TrendingUp size={22} />,
      link: '/challans?status=DRAFT',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>A live snapshot of customers, inventory and sales challans.</p>
        </div>
        <div className="text-xs text-dim">
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-4 mb-8">
        {statCards.map((card) => (
          <Link key={card.label} to={card.link} style={{ textDecoration: 'none' }}>
            <div className="stat-card">
              <div className="stat-icon">
                {card.icon}
              </div>
              <div className="stat-info">
                <div className="stat-value">{card.value.toLocaleString()}</div>
                <div className="stat-label">{card.label}</div>
                <div className="stat-sub">{card.sub}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid-2 gap-6">
        {/* Recent Challans */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Challans</h3>
            <Link to="/challans" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {!stats?.recentChallans.length ? (
            <div className="empty-state">
              <p>No challans yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {stats.recentChallans.map((challan: Challan) => (
                <Link
                  key={challan.id}
                  to={`/challans/${challan.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="detail-row"
                    style={{ cursor: 'pointer', transition: 'background var(--transition-fast)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="text-sm font-semibold" style={{ color: 'var(--color-text)', marginBottom: 2 }}>
                        {challan.challanNumber}
                      </div>
                      <div className="text-xs text-dim">
                        {challan.customer?.name} · {format(new Date(challan.createdAt), 'dd MMM yyyy')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        ₹{Number(challan.totalAmount).toLocaleString('en-IN')}
                      </span>
                      <span className={statusBadge(challan.status)}>
                        {statusIcon(challan.status)}
                        {challan.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
              Low Stock Alerts
            </h3>
            <Link to="/products?lowStock=true" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {!stats?.lowStockItems.length ? (
            <div className="empty-state">
              <div className="text-success">✓ All products have sufficient stock</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {stats.lowStockItems.map((product: Product) => {
                const pct = Math.min(100, (product.currentStock / Math.max(1, product.minStockQty * 2)) * 100);
                const isOut = product.currentStock === 0;
                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="detail-row" style={{ cursor: 'pointer' }}>
                      <div style={{ flex: 1 }}>
                        <div className="text-sm font-semibold" style={{ color: 'var(--color-text)', marginBottom: 2 }}>
                          {product.name}
                        </div>
                        <div className="text-xs text-dim">{product.sku}</div>
                        <div className="stock-bar-wrapper" style={{ marginTop: 'var(--space-2)' }}>
                          <div className="stock-bar">
                            <div
                              className="stock-bar-fill"
                              style={{
                                width: `${pct}%`,
                                background: isOut ? 'var(--color-danger)' : 'var(--color-warning)',
                              }}
                            />
                          </div>
                          <span className="text-xs" style={{ color: isOut ? 'var(--color-danger)' : 'var(--color-warning)', fontWeight: 600, flexShrink: 0 }}>
                            {product.currentStock} / {product.minStockQty * 2}
                          </span>
                        </div>
                      </div>
                      <span
                        className="badge"
                        style={{
                          background: isOut ? 'var(--color-danger-dim)' : 'var(--color-warning-dim)',
                          color: isOut ? 'var(--color-danger)' : 'var(--color-warning)',
                          marginLeft: 'var(--space-3)',
                          alignSelf: 'flex-start',
                        }}
                      >
                        {isOut ? 'OUT' : 'LOW'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
