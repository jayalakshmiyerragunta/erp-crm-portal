import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customersApi } from '../../api';
import type { Customer, CustomerFollowup } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft, Phone, Mail, MapPin, Building, Briefcase,
  FileText, Calendar, Plus, MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusClass: Record<string, string> = {
  ACTIVE: 'badge-success',
  LEAD: 'badge-info',
  INACTIVE: 'badge-neutral',
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followups, setFollowups] = useState<CustomerFollowup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([
      customersApi.getById(id),
      customersApi.getFollowups(id)
    ])
      .then(([custRes, fupRes]) => {
        setCustomer(custRes.data.data);
        setFollowups(fupRes.data.data);
      })
      .catch((err) => {
        toast.error('Failed to load customer details');
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !newNote.trim()) return;

    setIsSubmittingNote(true);
    try {
      const res = await customersApi.addFollowup(id, newNote);
      setFollowups([res.data.data, ...followups]);
      setNewNote('');
      toast.success('Follow-up note added');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  }

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner spinner-lg" />
        <p>Loading customer profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="empty-state">
        <p>Customer not found</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/customers')}>
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        className="btn btn-ghost btn-sm mb-6"
        onClick={() => navigate('/customers')}
        style={{ paddingLeft: 0 }}
      >
        <ArrowLeft size={16} /> Back to customers
      </button>

      <div className="grid-3">
        {/* Left Column - Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-xl font-bold mb-1">{customer.name}</h1>
                {customer.businessName && <div className="text-muted">{customer.businessName}</div>}
              </div>
              <span className={`badge ${statusClass[customer.status]}`}>{customer.status}</span>
            </div>

            <div className="divider" style={{ margin: 'var(--space-4) 0' }} />

            <div className="flex-col gap-3">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-dim" />
                <span>{customer.mobile}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-dim" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-dim" style={{ marginTop: 2 }} />
                  <span style={{ flex: 1 }}>{customer.address}</span>
                </div>
              )}
            </div>

            <div className="divider" style={{ margin: 'var(--space-4) 0' }} />

            <div className="detail-row">
              <span className="detail-label"><Briefcase size={14} className="inline mr-2" /> Type</span>
              <span className="detail-value">{customer.customerType}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label"><Building size={14} className="inline mr-2" /> GST Number</span>
              <span className="detail-value">{customer.gstNumber || <span className="text-dim">Not provided</span>}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label"><Calendar size={14} className="inline mr-2" /> Follow-up Date</span>
              <span className="detail-value">
                {customer.followUpDate ? (
                  <span className={new Date(customer.followUpDate) < new Date() ? 'text-danger font-semibold' : ''}>
                    {format(new Date(customer.followUpDate), 'dd MMM yyyy')}
                  </span>
                ) : (
                  <span className="text-dim">None set</span>
                )}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label"><FileText size={14} className="inline mr-2" /> Joined</span>
              <span className="detail-value">{format(new Date(customer.createdAt), 'dd MMM yyyy')}</span>
            </div>
          </div>

          {customer.notes && (
            <div className="card">
              <h3 className="card-title mb-3">General Notes</h3>
              <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Timeline */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <h3 className="card-title">Follow-up Timeline</h3>
            </div>

            {canEdit && (
              <form onSubmit={handleAddNote} className="mb-8 p-4 bg-surface-2 rounded-lg border border-border">
                <textarea
                  className="form-textarea w-full mb-3"
                  placeholder="Add a new follow-up note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  required
                  rows={3}
                  style={{ background: 'var(--color-surface)' }}
                />
                <div className="flex justify-end">
                  <button type="submit" className="btn btn-primary" disabled={isSubmittingNote || !newNote.trim()}>
                    {isSubmittingNote ? <span className="spinner w-4 h-4" /> : <><Plus size={16} /> Add Note</>}
                  </button>
                </div>
              </form>
            )}

            <div className="flex-1 overflow-y-auto pr-2">
              {followups.length === 0 ? (
                <div className="empty-state py-8">
                  <MessageSquare size={32} className="text-dim mb-3 mx-auto" />
                  <p>No follow-ups recorded yet</p>
                </div>
              ) : (
                <div className="timeline">
                  {followups.map((fup) => (
                    <div key={fup.id} className="timeline-item">
                      <div className="timeline-dot">
                        <MessageSquare size={14} />
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-note">{fup.note}</div>
                        <div className="timeline-meta flex items-center justify-between">
                          <span>{fup.user.name} ({fup.user.role})</span>
                          <span>{format(new Date(fup.createdAt), 'dd MMM yyyy, HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
