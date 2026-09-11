import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { challansApi } from '../../api';
import type { Challan } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, FileText, 
  User, Building2, Phone, Mail, Printer, AlertTriangle 
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const statusIcon = (status: string) => {
  if (status === 'CONFIRMED') return <CheckCircle size={16} className="text-success" />;
  if (status === 'CANCELLED') return <XCircle size={16} className="text-danger" />;
  return <Clock size={16} className="text-warning" />;
};

export default function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canModify = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [challan, setChallan] = useState<Challan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    challansApi.getById(id)
      .then((res) => setChallan(res.data.data))
      .catch((err) => {
        toast.error('Failed to load challan details');
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleConfirm() {
    if (!id || !confirm('Are you sure? This will permanently deduct stock for all items.')) return;
    setIsActioning(true);
    try {
      await challansApi.confirm(id);
      toast.success('Challan confirmed and stock deducted');
      // Reload
      const res = await challansApi.getById(id);
      setChallan(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm challan');
    } finally {
      setIsActioning(false);
    }
  }

  async function handleCancel() {
    if (!id || !confirm('Are you sure? This will cancel the challan and restore any deducted stock.')) return;
    setIsActioning(true);
    try {
      await challansApi.cancel(id);
      toast.success('Challan cancelled');
      // Reload
      const res = await challansApi.getById(id);
      setChallan(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel challan');
    } finally {
      setIsActioning(false);
    }
  }

  async function exportPDF() {
    const el = document.getElementById('challan-document');
    if (!el) return;
    
    setIsExporting(true);
    toast.loading('Generating PDF...', { id: 'pdf-toast' });
    
    try {
      // Temporarily hide buttons in print view if we were rendering them inside the target
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${challan?.challanNumber || 'challan'}.pdf`);
      
      toast.success('PDF downloaded!', { id: 'pdf-toast' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF', { id: 'pdf-toast' });
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner spinner-lg" />
        <p>Loading challan...</p>
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="empty-state">
        <p>Challan not found</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/challans')}>
          Back to Challans
        </button>
      </div>
    );
  }

  const { customerSnapshot: c } = challan;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/challans')} style={{ paddingLeft: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex gap-3">
          {canModify && challan.status === 'DRAFT' && (
            <button className="btn btn-success" onClick={handleConfirm} disabled={isActioning}>
              <CheckCircle size={16} /> Confirm & Deduct Stock
            </button>
          )}
          {canModify && challan.status !== 'CANCELLED' && (
            <button className="btn btn-danger" onClick={handleCancel} disabled={isActioning}>
              <XCircle size={16} /> Cancel Challan
            </button>
          )}
          <button className="btn btn-secondary" onClick={exportPDF} disabled={isExporting}>
            {isExporting ? <span className="spinner w-4 h-4 border-2" /> : <Printer size={16} />} 
            Export PDF
          </button>
        </div>
      </div>

      {challan.status === 'DRAFT' && (
        <div className="alert alert-warning mb-6">
          <AlertTriangle size={18} />
          <span>This challan is a <strong>Draft</strong>. Stock has not been deducted yet. Confirm it to finalize the dispatch.</span>
        </div>
      )}

      {/* A4 Paper styled container for the PDF export */}
      <div 
        id="challan-document"
        className="card" 
        style={{ 
          background: 'white', 
          color: 'black', 
          padding: '2rem 3rem',
          borderRadius: '4px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          minHeight: '297mm' // A4 proportion
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b" style={{ borderColor: '#e2e8f0' }}>
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: '#0f172a' }}>SALES CHALLAN</h1>
            <div className="text-sm" style={{ color: '#64748b' }}>Operations Portal ERP</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>{challan.challanNumber}</div>
            <div className="flex items-center justify-end gap-2 text-sm font-medium mb-1">
              Status: 
              <span className="flex items-center gap-1" style={{ 
                color: challan.status === 'CONFIRMED' ? '#059669' : challan.status === 'CANCELLED' ? '#dc2626' : '#d97706' 
              }}>
                {statusIcon(challan.status)} {challan.status}
              </span>
            </div>
            <div className="text-sm" style={{ color: '#64748b' }}>
              Date: {format(new Date(challan.createdAt), 'dd MMM yyyy')}
            </div>
            <div className="text-sm" style={{ color: '#64748b' }}>
              Created by: {challan.creator?.name}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8 p-4 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>Billed To</h3>
          <div className="grid grid-cols-2 gap-4 text-sm" style={{ color: '#334155' }}>
            <div>
              <div className="flex items-start gap-2 mb-2">
                <User size={16} style={{ color: '#94a3b8', marginTop: 2 }} />
                <span className="font-semibold text-base">{c.name}</span>
              </div>
              {c.businessName && (
                <div className="flex items-start gap-2 mb-2">
                  <Building2 size={16} style={{ color: '#94a3b8', marginTop: 2 }} />
                  <span>{c.businessName}</span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-start gap-2 mb-2">
                <Phone size={16} style={{ color: '#94a3b8', marginTop: 2 }} />
                <span>{c.mobile}</span>
              </div>
              {c.email && (
                <div className="flex items-start gap-2 mb-2">
                  <Mail size={16} style={{ color: '#94a3b8', marginTop: 2 }} />
                  <span>{c.email}</span>
                </div>
              )}
              {c.gstNumber && (
                <div className="flex items-start gap-2 mb-2">
                  <FileText size={16} style={{ color: '#94a3b8', marginTop: 2 }} />
                  <span>GST: {c.gstNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <table className="w-full mb-8 text-sm" style={{ color: '#334155', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
              <th className="py-3 px-4 text-left font-bold" style={{ color: '#475569' }}>#</th>
              <th className="py-3 px-4 text-left font-bold" style={{ color: '#475569' }}>Item Description</th>
              <th className="py-3 px-4 text-right font-bold" style={{ color: '#475569' }}>Rate</th>
              <th className="py-3 px-4 text-right font-bold" style={{ color: '#475569' }}>Qty</th>
              <th className="py-3 px-4 text-right font-bold" style={{ color: '#475569' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {challan.items?.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td className="py-4 px-4">{i + 1}</td>
                <td className="py-4 px-4">
                  <div className="font-semibold" style={{ color: '#0f172a' }}>{item.productSnapshot.name}</div>
                  <div className="text-xs mt-1" style={{ color: '#64748b' }}>SKU: {item.productSnapshot.sku}</div>
                </td>
                <td className="py-4 px-4 text-right">₹{Number(item.unitPrice).toLocaleString('en-IN')}</td>
                <td className="py-4 px-4 text-right font-medium">{item.quantity}</td>
                <td className="py-4 px-4 text-right font-bold">₹{Number(item.totalPrice).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2 text-sm" style={{ color: '#475569' }}>
              <span>Total Quantity:</span>
              <span className="font-semibold">{challan.totalQty} units</span>
            </div>
            <div className="flex justify-between py-3 text-lg font-bold border-t" style={{ borderColor: '#cbd5e1', color: '#0f172a' }}>
              <span>Grand Total:</span>
              <span style={{ color: '#4f46e5' }}>₹{Number(challan.totalAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t flex justify-between text-xs" style={{ borderColor: '#e2e8f0', color: '#94a3b8' }}>
          <div>Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')}</div>
          <div>This is a computer generated document.</div>
        </div>
      </div>
    </div>
  );
}
