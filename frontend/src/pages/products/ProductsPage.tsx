import { useEffect, useState, useCallback } from 'react';
import { productsApi } from '../../api';
import type { Product, Pagination } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Plus, Edit2, TrendingDown, History, AlertTriangle, ArrowUpCircle } from 'lucide-react';
import ProductForm from './ProductForm';
import StockInForm from './StockInForm';
import MovementsDrawer from './MovementsDrawer';

export default function ProductsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(1);

  // Modals/Drawers
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [showStockForm, setShowStockForm] = useState(false);
  
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { page, limit: 15 };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (lowStockFilter) params.lowStock = true;

      const [prodRes, catRes] = await Promise.all([
        productsApi.getAll(params),
        productsApi.getCategories()
      ]);
      
      setProducts(prodRes.data.data.products);
      setPagination(prodRes.data.data.pagination);
      setCategories(catRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, categoryFilter, lowStockFilter]);

  useEffect(() => {
    // Parse URL params initially for dashboard link "View All Low Stock"
    const params = new URLSearchParams(window.location.search);
    if (params.get('lowStock') === 'true') {
      setLowStockFilter(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  function handleProductSaved() {
    setShowProductForm(false);
    setEditProduct(null);
    loadData();
  }

  function handleStockSaved() {
    setShowStockForm(false);
    setStockProduct(null);
    loadData();
  }

  return (
    <div style={{ animation: 'slideUp 0.4s ease' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Products & Inventory</h1>
          <p>Manage product catalog and monitor stock levels</p>
        </div>
        {canEdit && (
          <button
            className="btn btn-primary"
            onClick={() => { setEditProduct(null); setShowProductForm(true); }}
          >
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      <div className="card mb-5" style={{ padding: 'var(--space-4)' }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="search-bar">
            <Search size={16} />
            <input
              className="search-input"
              placeholder="Search by name, SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          
          <select
            className="form-select"
            style={{ width: '200px' }}
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={lowStockFilter}
              onChange={(e) => { setLowStockFilter(e.target.checked); setPage(1); }}
              style={{ width: 16, height: 16, accentColor: 'var(--color-warning)' }}
            />
            <span className="text-sm">Low stock only</span>
          </label>

          {(search || categoryFilter || lowStockFilter) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setCategoryFilter(''); setLowStockFilter(false); setPage(1); }}
            >
              Clear filters
            </button>
          )}

          <div style={{ marginLeft: 'auto' }} className="text-xs text-dim">
            {pagination?.total ?? 0} total
          </div>
        </div>
      </div>

      <div className="grid-3">
        {isLoading ? (
          <div className="col-span-full loading-state py-12">
            <div className="spinner spinner-lg mb-4" />
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full empty-state py-12">
            <Search size={32} className="text-dim mb-4 mx-auto" />
            <h3 className="text-lg">No products found</h3>
          </div>
        ) : (
          products.map((product) => {
            const stockPct = Math.min(100, (product.currentStock / Math.max(1, product.minStockQty * 2)) * 100);
            const isOut = product.currentStock === 0;
            const isLow = product.isLowStock;
            
            return (
              <div key={product.id} className={`card ${!product.isActive ? 'opacity-60' : ''}`} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column' }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{product.category}</div>
                    <h3 className="font-bold text-base leading-tight mb-1">{product.name}</h3>
                    <div className="text-xs text-dim font-mono">{product.sku}</div>
                  </div>
                  {isOut ? (
                    <span className="badge badge-danger ml-2"><TrendingDown size={10} /> OUT</span>
                  ) : isLow ? (
                    <span className="badge badge-warning ml-2"><AlertTriangle size={10} /> LOW</span>
                  ) : (
                    <span className="badge badge-success ml-2">OK</span>
                  )}
                </div>

                <div className="flex items-end justify-between mt-auto pt-4 mb-4">
                  <div>
                    <div className="text-xs text-dim mb-1">Unit Price</div>
                    <div className="font-semibold text-lg">₹{Number(product.unitPrice).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-dim mb-1">Stock Location</div>
                    <div className="font-medium text-sm">{product.warehouseLocation || '—'}</div>
                  </div>
                </div>

                <div className="stock-bar-wrapper mb-2">
                  <div className="stock-bar">
                    <div 
                      className="stock-bar-fill" 
                      style={{ 
                        width: `${stockPct}%`,
                        background: isOut ? 'var(--color-danger)' : isLow ? 'var(--color-warning)' : 'var(--color-success)'
                      }} 
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs font-medium mb-5">
                  <span style={{ color: isOut ? 'var(--color-danger)' : isLow ? 'var(--color-warning)' : 'var(--color-text)' }}>
                    {product.currentStock} in stock
                  </span>
                  <span className="text-dim">Min: {product.minStockQty}</span>
                </div>

                <div className="flex gap-2 border-t border-border pt-4 mt-auto">
                  {canEdit && (
                    <>
                      <button 
                        className="btn btn-secondary flex-1 px-2"
                        onClick={() => { setStockProduct(product); setShowStockForm(true); }}
                      >
                        <ArrowUpCircle size={14} className="text-success" /> IN
                      </button>
                      <button 
                        className="btn btn-secondary flex-1 px-2"
                        onClick={() => { setEditProduct(product); setShowProductForm(true); }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                    </>
                  )}
                  <button 
                    className="btn btn-secondary flex-1 px-2"
                    onClick={() => setHistoryProduct(product)}
                  >
                    <History size={14} /> Log
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
          <div className="pagination mt-6">
            <span className="pagination-info">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={!pagination.hasPrevPage} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button className="page-btn" disabled={!pagination.hasNextPage} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}

      {/* Modals & Drawers */}
      {showProductForm && (
        <ProductForm 
          product={editProduct} 
          onClose={() => { setShowProductForm(false); setEditProduct(null); }} 
          onSaved={handleProductSaved} 
        />
      )}
      
      {showStockForm && stockProduct && (
        <StockInForm 
          product={stockProduct} 
          onClose={() => { setShowStockForm(false); setStockProduct(null); }} 
          onSaved={handleStockSaved} 
        />
      )}

      {historyProduct && (
        <MovementsDrawer 
          product={historyProduct} 
          onClose={() => setHistoryProduct(null)} 
        />
      )}
    </div>
  );
}
