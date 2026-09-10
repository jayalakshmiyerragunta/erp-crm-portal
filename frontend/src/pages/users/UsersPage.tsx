import { useEffect, useState } from 'react';
import { usersApi } from '../../api';
import type { User, Role } from '../../types';
import { Shield, Check, X as XIcon, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const roleColors: Record<Role, string> = {
  ADMIN: 'badge-primary',
  SALES: 'badge-success',
  WAREHOUSE: 'badge-warning',
  ACCOUNTS: 'badge-info',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES' as Role,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  function loadUsers() {
    setIsLoading(true);
    usersApi.getAll()
      .then((res) => setUsers(res.data.data as User[]))
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load users');
      })
      .finally(() => setIsLoading(false));
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    try {
      await usersApi.update(id, { isActive: !currentStatus });
      toast.success(currentStatus ? 'User disabled' : 'User enabled');
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      await usersApi.create(form);
      toast.success('User created successfully');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'SALES' });
      loadUsers();
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors) {
        const map: Record<string, string> = {};
        apiErrors.forEach((e: { field: string; message: string }) => {
          map[e.field] = e.message;
        });
        setErrors(map);
      } else {
        toast.error(err?.response?.data?.message ?? 'Failed to create user');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ animation: 'slideUp 0.4s ease' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1>User Management</h1>
          <p>Manage system access and roles for employees</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <UserPlus size={16} /> Add User
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    <div className="loading-state py-8">
                      <div className="spinner" />
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                    <td className="font-medium text-text">{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${roleColors[u.role]}`}>
                        <Shield size={12} /> {u.role}
                      </span>
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="badge badge-success"><Check size={12} /> Active</span>
                      ) : (
                        <span className="badge badge-neutral"><XIcon size={12} /> Disabled</span>
                      )}
                    </td>
                    <td className="text-sm text-dim">{format(new Date(u.createdAt), 'dd MMM yyyy')}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleStatus(u.id, u.isActive)}
                      >
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2 className="modal-title flex items-center gap-2">
                <UserPlus size={20} className="text-primary" />
                Add New User
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)} type="button">
                <XIcon size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input
                    className={`form-input${errors.name ? ' error' : ''}`}
                    value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(e => ({ ...e, name: '' })); }}
                    required
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email Address <span className="required">*</span></label>
                  <input
                    type="email"
                    className={`form-input${errors.email ? ' error' : ''}`}
                    value={form.email}
                    onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(e => ({ ...e, email: '' })); }}
                    required
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Password <span className="required">*</span></label>
                  <input
                    type="password"
                    className={`form-input${errors.password ? ' error' : ''}`}
                    value={form.password}
                    onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(e => ({ ...e, password: '' })); }}
                    placeholder="Min 6 chars, 1 uppercase, 1 number"
                    required
                  />
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Role <span className="required">*</span></label>
                  <select
                    className="form-select"
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
                  >
                    <option value="SALES">Sales</option>
                    <option value="WAREHOUSE">Warehouse</option>
                    <option value="ACCOUNTS">Accounts</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <span className="spinner w-4 h-4 border-2" /> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
