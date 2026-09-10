import { useState } from 'react';
import { productsApi } from '../../api';
import type { Product } from '../../types';
import { X, ArrowUpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}

export default function StockInForm({ product, onClose, onSaved }: Props) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('New stock arrival');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive integer');
      setIsSaving(false);
      return;
    }

    try {
      await productsApi.addStock(product.id, qty, reason);
      toast.success(`Added ${qty} units to ${product.name}`);
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to add stock');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 className="modal-title flex items-center gap-2">
            <ArrowUpCircle className="text-success" size={20} />
            Stock IN Entry
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="mb-4 p-3 bg-surface-2 rounded-lg border border-border">
              <div className="text-sm font-bold text-text">{product.name}</div>
              <div className="text-xs text-dim mb-2">{product.sku}</div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Current Stock:</span>
                <span className="font-bold">{product.currentStock}</span>
              </div>
            </div>

            {error && (
              <div className="alert alert-error mb-4">
                {error}
              </div>
            )}

            <div className="form-group mb-4">
              <label className="form-label">
                Quantity to Add <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                className="form-input text-lg font-bold"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 50"
                required
                autoFocus
              />
            </div>

            <div className="form-group mb-2">
              <label className="form-label">
                Reason / Note <span className="required">*</span>
              </label>
              <input
                className="form-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Supplier delivery"
                required
              />
            </div>
            
            {quantity && !isNaN(parseInt(quantity, 10)) && parseInt(quantity, 10) > 0 && (
              <div className="text-center mt-4 text-sm text-muted">
                New stock will be: <strong className="text-success text-lg">{product.currentStock + parseInt(quantity, 10)}</strong>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={isSaving || !quantity}>
              {isSaving ? <span className="spinner w-4 h-4 border-2" /> : 'Confirm Stock IN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
