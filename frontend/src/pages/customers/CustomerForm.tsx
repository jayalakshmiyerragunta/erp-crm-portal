import { useState } from 'react';
import { customersApi } from '../../api';
import type { Customer } from '../../types';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  customer: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}

const CUSTOMER_TYPES = ['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'] as const;
const CUSTOMER_STATUSES = ['LEAD', 'ACTIVE', 'INACTIVE'] as const;

export default function CustomerForm({ customer, onClose, onSaved }: Props) {
  const isEdit = !!customer;

  const [form, setForm] = useState({
    name: customer?.name ?? '',
    mobile: customer?.mobile ?? '',
    email: customer?.email ?? '',
    businessName: customer?.businessName ?? '',
    gstNumber: customer?.gstNumber ?? '',
    customerType: customer?.customerType ?? 'RETAIL',
    address: customer?.address ?? '',
    status: customer?.status ?? 'LEAD',
    followUpDate: customer?.followUpDate
      ? customer.followUpDate.slice(0, 10)
      : '',
    notes: customer?.notes ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const payload: Record<string, unknown> = {
      ...form,
      email: form.email || undefined,
      gstNumber: form.gstNumber || undefined,
      followUpDate: form.followUpDate
        ? new Date(form.followUpDate).toISOString()
        : undefined,
    };

    try {
      if (isEdit) {
        await customersApi.update(customer.id, payload);
        toast.success('Customer updated!');
      } else {
        await customersApi.create(payload);
        toast.success('Customer created!');
      }
      onSaved();
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors) {
        const map: Record<string, string> = {};
        apiErrors.forEach((e: { field: string; message: string }) => {
          map[e.field] = e.message;
        });
        setErrors(map);
      } else {
        toast.error(err?.response?.data?.message ?? 'Failed to save customer');
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Name <span className="required">*</span>
                </label>
                <input
                  className={`form-input${errors.name ? ' error' : ''}`}
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Full name"
                  required
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Mobile <span className="required">*</span>
                </label>
                <input
                  className={`form-input${errors.mobile ? ' error' : ''}`}
                  value={form.mobile}
                  onChange={(e) => set('mobile', e.target.value)}
                  placeholder="10-digit mobile number"
                  required
                />
                {errors.mobile && <span className="form-error">{errors.mobile}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="email@company.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input
                  className="form-input"
                  value={form.businessName}
                  onChange={(e) => set('businessName', e.target.value)}
                  placeholder="Company or shop name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input
                  className={`form-input${errors.gstNumber ? ' error' : ''}`}
                  value={form.gstNumber}
                  onChange={(e) => set('gstNumber', e.target.value.toUpperCase())}
                  placeholder="22AAAAA0000A1Z5"
                />
                {errors.gstNumber && <span className="form-error">{errors.gstNumber}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Customer Type <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.customerType}
                  onChange={(e) => set('customerType', e.target.value)}
                >
                  {CUSTOMER_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                >
                  {CUSTOMER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Follow-up Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => set('followUpDate', e.target.value)}
                />
              </div>

              <div className="form-group form-full">
                <label className="form-label">Address</label>
                <input
                  className="form-input"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="Full address"
                />
              </div>

              <div className="form-group form-full">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Add any notes about this customer..."
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? (
                <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</>
              ) : (
                isEdit ? 'Update Customer' : 'Create Customer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
