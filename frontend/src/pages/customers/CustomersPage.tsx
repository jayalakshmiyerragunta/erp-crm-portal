import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../../api';
import type { Customer, CustomerStatus, CustomerType, Pagination } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Plus, Eye, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import CustomerForm from './CustomerForm';

const statusClass: Record<CustomerStatus, string> = {
  ACTIVE: 'badge-success',
  LEAD: 'badge-info',
  INACTIVE: 'badge-neutral',
};

const typeClass: Record<CustomerType, string> = {
  RETAIL: 'badge-primary',
  WHOLESALE: 'badge-warning',
  DISTRIBUTOR: 'badge-danger',
};

export default function CustomersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.customerType = typeFilter;
      const res = await customersApi.getAll(params);
      setCustomers(res.data.data.customers);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  function handleCreated() {
    setShowForm(false);
    setEditCustomer(null);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Customers</h1>
          <p>Manage your customer base and CRM follow-ups</p>
        </div>
        {canEdit && (
          <button
            id="add-customer-btn"
            className="btn btn-primary"
            onClick={() => { setEditCustomer(null); setShowForm(true); }}
          >
            <Plus size={16} /> Add Customer
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="card mb-5" style={{ padding: 'var(--space-4)' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="search-bar">
            <Search size={16} />
            <input
              className="search-input"
              placeholder="Search name, mobile, business..."
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
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
          {(search || statusFilter || typeFilter) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setPage(1); }}
            >
              Clear filters
            </button>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <span className="text-xs text-dim">
              {pagination?.total ?? 0} total
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Type</th>
                <th>Status</th>
                <th>Follow-up</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="table-empty">
                    <div className="loading-state" style={{ padding: 'var(--space-8)' }}>
                      <div className="spinner" />
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <Search size={24} />
                      </div>
                      <h3>No customers found</h3>
                      <p>Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 }}>
                        {c.name}
                      </div>
                      {c.businessName && (
                        <div className="text-xs text-dim">{c.businessName}</div>
                      )}
                    </td>
                    <td>{c.mobile}</td>
                    <td>
                      <span className={`badge ${typeClass[c.customerType]}`}>{c.customerType}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusClass[c.status]}`}>{c.status}</span>
                    </td>
                    <td>
                      {c.followUpDate ? (
                        <span style={{
                          color: new Date(c.followUpDate) < new Date() ? 'var(--color-danger)' : 'var(--color-text-muted)',
                          fontSize: '0.8rem'
                        }}>
                          {format(new Date(c.followUpDate), 'dd MMM yyyy')}
                        </span>
                      ) : (
                        <span className="text-dim text-xs">—</span>
                      )}
                    </td>
                    <td className="text-xs text-dim">
                      {format(new Date(c.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-secondary btn-sm btn-icon"
                          title="View details"
                          onClick={() => navigate(`/customers/${c.id}`)}
                        >
                          <Eye size={14} />
                        </button>
                        {canEdit && (
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Edit customer"
                            onClick={() => { setEditCustomer(c); setShowForm(true); }}
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                      </div>
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
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} results
            </span>
            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                return (
                  <button
                    key={p}
                    className={`page-btn${p === page ? ' active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                className="page-btn"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <CustomerForm
          customer={editCustomer}
          onClose={() => { setShowForm(false); setEditCustomer(null); }}
          onSaved={handleCreated}
        />
      )}
    </div>
  );
}
