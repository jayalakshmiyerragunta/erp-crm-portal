import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { challansApi } from '../../api';
import type { Challan, Pagination } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Plus, Eye, ChevronLeft, ChevronRight, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'badge-warning',
    CONFIRMED: 'badge-success',
    CANCELLED: 'badge-danger',
  };
  return `badge ${map[status] ?? 'badge-neutral'}`;
};

const statusIcon = (status: string) => {
  if (status === 'CONFIRMED') return <CheckCircle size={12} />;
  if (status === 'CANCELLED') return <XCircle size={12} />;
  return <Clock size={12} />;
};

export default function ChallansPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canCreate = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [challans, setChallans] = useState<Challan[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      
      const res = await challansApi.getAll(params);
      setChallans(res.data.data.challans);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);
  
  // Sync URL params when status changes
  useEffect(() => {
    if (statusFilter) {
      setSearchParams({ status: statusFilter });
    } else {
      setSearchParams({});
    }
  }, [statusFilter, setSearchParams]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Sales Challans</h1>
          <p>Manage order dispatch and delivery challans</p>
        </div>
        {canCreate && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/challans/new')}
          >
            <Plus size={16} /> Create Challan
          </button>
        )}
      </div>

      <div className="card mb-5" style={{ padding: 'var(--space-4)' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="search-bar">
            <Search size={16} />
            <input
              className="search-input"
              placeholder="Search challan number..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft (Pending Confirm)</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {(search || statusFilter) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
            >
              Clear filters
            </button>
          )}
          
          <div style={{ marginLeft: 'auto' }} className="text-xs text-dim">
            {pagination?.total ?? 0} total
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Challan No.</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Items Qty</th>
                <th>Total Value</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="table-empty">
                    <div className="loading-state py-8">
                      <div className="spinner" />
                    </div>
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty">
                    <div className="empty-state">
                      <FileText size={32} className="text-dim mb-4 mx-auto" />
                      <h3 className="mb-2">No challans found</h3>
                      <p>Try adjusting your search filters or create a new one.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                challans.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/challans/${c.id}`} className="font-semibold text-primary hover:underline">
                        {c.challanNumber}
                      </Link>
                    </td>
                    <td>
                      <div className="font-medium text-text">{c.customerSnapshot.name}</div>
                      {c.customerSnapshot.businessName && (
                        <div className="text-xs text-dim">{c.customerSnapshot.businessName}</div>
                      )}
                    </td>
                    <td>
                      <span className={statusBadge(c.status)}>
                        {statusIcon(c.status)}
                        {c.status}
                      </span>
                    </td>
                    <td className="font-mono text-sm">{c.totalQty}</td>
                    <td className="font-semibold">₹{Number(c.totalAmount).toLocaleString('en-IN')}</td>
                    <td>
                      <div className="text-sm">{format(new Date(c.createdAt), 'dd MMM yyyy')}</div>
                      <div className="text-xs text-dim">by {c.creator?.name}</div>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm btn-icon"
                        onClick={() => navigate(`/challans/${c.id}`)}
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <span className="pagination-info">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={!pagination.hasPrevPage} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                return (
                  <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
                );
              })}
              <button className="page-btn" disabled={!pagination.hasNextPage} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
