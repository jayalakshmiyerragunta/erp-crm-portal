import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi, productsApi, challansApi } from '../../api';
import type { Customer, Product } from '../../types';
import { ArrowLeft, Trash2, Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface LineItem {
  id: string; // temp id for UI
  productId: string;
  quantity: number;
}

export default function CreateChallanPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ id: Math.random().toString(), productId: '', quantity: 1 }]);
  const [status, setStatus] = useState<'DRAFT' | 'CONFIRMED'>('DRAFT');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      customersApi.getAll({ limit: 100, status: 'ACTIVE' }),
      productsApi.getAll({ limit: 100 })
    ])
      .then(([custRes, prodRes]) => {
        setCustomers(custRes.data.data.customers as Customer[]);
        // Only active products can be added to challan
        setProducts((prodRes.data.data.products as Product[]).filter(p => p.isActive));
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load customers and products');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const productMap = useMemo(() => {
    return new Map(products.map(p => [p.id, p]));
  }, [products]);

  // Validation
  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (!selectedCustomerId) errs.push('Select a customer');
    
    let hasValidItem = false;
    const selectedProductIds = new Set<string>();

    for (const item of items) {
      if (!item.productId) continue;
      hasValidItem = true;
      
      if (selectedProductIds.has(item.productId)) {
        errs.push('Duplicate products in line items');
        break; // Only show once
      }
      selectedProductIds.add(item.productId);

      if (item.quantity <= 0) {
        errs.push('Quantities must be greater than 0');
      } else {
        const product = productMap.get(item.productId);
        if (product && status === 'CONFIRMED' && item.quantity > product.currentStock) {
          errs.push(`Insufficient stock for ${product.name} (req: ${item.quantity}, avail: ${product.currentStock})`);
        }
      }
    }
    
    if (!hasValidItem) errs.push('Add at least one product');

    return errs;
  }, [selectedCustomerId, items, productMap, status]);

  const totals = useMemo(() => {
    let qty = 0;
    let amount = 0;
    for (const item of items) {
      if (!item.productId || item.quantity <= 0) continue;
      const product = productMap.get(item.productId);
      if (product) {
        qty += item.quantity;
        amount += Number(product.unitPrice) * item.quantity;
      }
    }
    return { qty, amount };
  }, [items, productMap]);

  function addLineItem() {
    setItems([...items, { id: Math.random().toString(), productId: '', quantity: 1 }]);
  }

  function removeLineItem(id: string) {
    if (items.length === 1) return; // Must have at least 1
    setItems(items.filter(i => i.id !== id));
  }

  function updateItem(id: string, field: 'productId' | 'quantity', value: string | number) {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validationErrors.length > 0) return;

    setError('');
    setIsSaving(true);
    try {
      const payload = {
        customerId: selectedCustomerId,
        status,
        items: items
          .filter(i => i.productId)
          .map(i => ({ productId: i.productId, quantity: i.quantity }))
      };
      
      const res = await challansApi.create(payload);
      toast.success(`Challan ${res.data.data.challanNumber} created successfully`);
      navigate(`/challans/${res.data.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create challan');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="loading-state h-full flex flex-col items-center justify-center">
        <div className="spinner spinner-lg mb-4" />
        <p>Loading master data...</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'slideUp 0.4s ease', maxWidth: 1000, margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/challans')} style={{ paddingLeft: 0 }}>
        <ArrowLeft size={16} /> Back to Challans
      </button>

      <div className="page-header mb-6">
        <div>
          <h1 className="text-2xl font-bold">Create Sales Challan</h1>
          <p className="text-muted">Draft a new dispatch document for an active customer</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {validationErrors.length > 0 && status === 'CONFIRMED' && (
        <div className="alert alert-warning mb-6">
          <AlertCircle size={18} />
          <div>
            <div className="font-semibold mb-1">Cannot confirm challan yet:</div>
            <ul className="pl-5 text-sm m-0">
              {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card mb-6 p-6">
          <h3 className="card-title mb-4">Customer Details</h3>
          <div className="form-group max-w-md">
            <label className="form-label">Select Customer <span className="text-danger">*</span></label>
            <select
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
            >
              <option value="">-- Choose an active customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.businessName ? `(${c.businessName})` : ''} — {c.mobile}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card mb-6 p-0 overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center bg-surface-2">
            <h3 className="card-title mb-0">Line Items</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addLineItem}>
              <Plus size={14} /> Add Product
            </button>
          </div>

          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Product</th>
                  <th style={{ width: '20%' }}>Unit Price</th>
                  <th style={{ width: '20%' }}>Quantity</th>
                  <th style={{ width: '15%' }}>Total</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const product = productMap.get(item.productId);
                  const price = product ? Number(product.unitPrice) : 0;
                  const lineTotal = price * item.quantity;
                  const isStockWarning = status === 'CONFIRMED' && product && product.currentStock < item.quantity;

                  return (
                    <tr key={item.id} style={{ background: 'transparent' }}>
                      <td className="pt-4 pb-4">
                        <select
                          className="form-select w-full"
                          value={item.productId}
                          onChange={(e) => updateItem(item.id, 'productId', e.target.value)}
                          required
                        >
                          <option value="">-- Select Product --</option>
                          {products.map(p => {
                            const isSelectedElsewhere = items.some(i => i.id !== item.id && i.productId === p.id);
                            return (
                              <option key={p.id} value={p.id} disabled={isSelectedElsewhere}>
                                {p.name} (Stock: {p.currentStock})
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td className="pt-4 pb-4 font-mono">
                        {product ? `₹${price.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="pt-4 pb-4">
                        <input
                          type="number"
                          min="1"
                          className={`form-input w-full ${isStockWarning ? 'border-danger text-danger' : ''}`}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          required
                        />
                        {isStockWarning && (
                          <div className="text-danger text-xs mt-1">Avail: {product.currentStock}</div>
                        )}
                      </td>
                      <td className="pt-4 pb-4 font-mono font-semibold">
                        ₹{lineTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="pt-4 pb-4 text-center">
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon text-dim hover:text-danger"
                          onClick={() => removeLineItem(item.id)}
                          disabled={items.length === 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-surface-2 border-t border-border">
                <tr>
                  <td colSpan={2} className="text-right font-semibold p-4">Order Totals:</td>
                  <td className="font-mono font-bold p-4">{totals.qty} units</td>
                  <td className="font-mono font-bold text-lg text-primary p-4">
                    ₹{totals.amount.toLocaleString('en-IN')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="card p-6 flex items-center justify-between bg-surface-2">
          <div>
            <div className="form-label mb-2">Save Action</div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-border rounded-lg hover:border-primary transition-colors bg-surface">
                <input 
                  type="radio" 
                  name="status" 
                  checked={status === 'DRAFT'} 
                  onChange={() => setStatus('DRAFT')}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <div>
                  <div className="font-semibold text-sm">Save as Draft</div>
                  <div className="text-xs text-muted">Stock will NOT be deducted yet</div>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-border rounded-lg hover:border-success transition-colors bg-surface">
                <input 
                  type="radio" 
                  name="status" 
                  checked={status === 'CONFIRMED'} 
                  onChange={() => setStatus('CONFIRMED')}
                  style={{ accentColor: 'var(--color-success)' }}
                />
                <div>
                  <div className="font-semibold text-sm text-success">Confirm & Deduct Stock</div>
                  <div className="text-xs text-muted">Inventory will be reduced immediately</div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-lg ${status === 'CONFIRMED' ? 'btn-success' : 'btn-primary'}`}
            disabled={isSaving || (status === 'CONFIRMED' && validationErrors.length > 0)}
          >
            {isSaving ? <span className="spinner w-5 h-5 border-2" /> : 'Create Challan'}
          </button>
        </div>
      </form>
    </div>
  );
}
