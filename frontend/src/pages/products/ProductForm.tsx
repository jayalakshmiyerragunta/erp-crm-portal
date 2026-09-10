import { useState } from 'react';
import { productsApi } from '../../api';
import type { Product } from '../../types';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductForm({ product, onClose, onSaved }: Props) {
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    category: product?.category ?? '',
    unitPrice: product?.unitPrice ?? '',
    currentStock: product?.currentStock ?? 0,
    minStockQty: product?.minStockQty ?? 5,
    warehouseLocation: product?.warehouseLocation ?? '',
    isActive: product?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  function set(field: string, value: string | number | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      ...form,
      unitPrice: Number(form.unitPrice),
      currentStock: Number(form.currentStock),
      minStockQty: Number(form.minStockQty),
    };

    try {
      if (isEdit) {
        // Can't update SKU
        const { sku, currentStock, ...updatePayload } = payload;
        await productsApi.update(product.id, updatePayload);
        toast.success('Product updated!');
      } else {
        await productsApi.create(payload);
        toast.success('Product created!');
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
        toast.error(err?.response?.data?.message ?? 'Failed to save product');
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group form-full">
                <label className="form-label">
                  Product Name <span className="required">*</span>
                </label>
                <input
                  className={`form-input${errors.name ? ' error' : ''}`}
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Premium Basmati Rice (25kg)"
                  required
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  SKU Code <span className="required">*</span>
                </label>
                <input
                  className={`form-input${errors.sku ? ' error' : ''}`}
                  value={form.sku}
                  onChange={(e) => set('sku', e.target.value.toUpperCase())}
                  placeholder="RICE-BAS-25"
                  required
                  disabled={isEdit}
                />
                {errors.sku && <span className="form-error">{errors.sku}</span>}
                {isEdit && <span className="form-hint">SKU cannot be changed</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Category <span className="required">*</span>
                </label>
                <input
                  className={`form-input${errors.category ? ' error' : ''}`}
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder="e.g. Food Grains"
                  required
                  list="categories-list"
                />
                {errors.category && <span className="form-error">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Unit Price (₹) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`form-input${errors.unitPrice ? ' error' : ''}`}
                  value={form.unitPrice}
                  onChange={(e) => set('unitPrice', e.target.value)}
                  required
                />
                {errors.unitPrice && <span className="form-error">{errors.unitPrice}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Warehouse Location</label>
                <input
                  className="form-input"
                  value={form.warehouseLocation}
                  onChange={(e) => set('warehouseLocation', e.target.value)}
                  placeholder="e.g. A-01-Shelf 2"
                />
              </div>

              {!isEdit && (
                <div className="form-group">
                  <label className="form-label">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    className={`form-input${errors.currentStock ? ' error' : ''}`}
                    value={form.currentStock}
                    onChange={(e) => set('currentStock', e.target.value)}
                  />
                  {errors.currentStock && <span className="form-error">{errors.currentStock}</span>}
                  <span className="form-hint">Can be updated via Stock IN later</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Min Stock Alert Qty</label>
                <input
                  type="number"
                  min="0"
                  className={`form-input${errors.minStockQty ? ' error' : ''}`}
                  value={form.minStockQty}
                  onChange={(e) => set('minStockQty', e.target.value)}
                />
                {errors.minStockQty && <span className="form-error">{errors.minStockQty}</span>}
              </div>
              
              {isEdit && (
                <div className="form-group flex justify-center flex-col mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.isActive}
                      onChange={(e) => set('isActive', e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
                    />
                    <span className="font-medium">Active Product</span>
                  </label>
                </div>
              )}
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
                isEdit ? 'Update Product' : 'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
