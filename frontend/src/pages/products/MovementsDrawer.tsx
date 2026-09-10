import { useEffect, useState, useCallback } from 'react';
import { productsApi } from '../../api';
import type { Product, StockMovement, Pagination } from '../../types';
import { X, ArrowUpCircle, ArrowDownCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  product: Product;
  onClose: () => void;
}

export default function MovementsDrawer({ product, onClose }: Props) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const loadMovements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await productsApi.getMovements(product.id, { page, limit: 15 });
      setMovements(res.data.data.movements);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [product.id, page]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div 
        className="modal" 
        style={{ 
          height: '100%', 
          maxWidth: 500, 
          borderRadius: 0, 
          animation: 'fadeIn 0.3s ease',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="modal-header flex items-center justify-between p-6">
          <div>
            <h2 className="modal-title flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              Stock Log
            </h2>
            <div className="text-sm text-muted mt-1">{product.name}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="loading-state py-12">
              <div className="spinner mb-4" />
              <p>Loading history...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="empty-state py-12">
              <Clock size={32} className="text-dim mb-4 mx-auto" />
              <p>No stock movements recorded yet</p>
            </div>
          ) : (
            <div className="timeline">
              {movements.map((m) => {
                const isIn = m.movementType === 'IN';
                return (
                  <div key={m.id} className="timeline-item" style={{ paddingBottom: 'var(--space-6)' }}>
                    <div 
                      className="timeline-dot"
                      style={{
                        background: isIn ? 'var(--color-success-dim)' : 'var(--color-danger-dim)',
                        borderColor: isIn ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                        color: isIn ? 'var(--color-success)' : 'var(--color-danger)'
                      }}
                    >
                      {isIn ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                    </div>
                    <div className="timeline-content">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-base font-semibold" style={{ color: isIn ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {isIn ? '+' : '-'}{m.quantity} Units
                        </div>
                        <div className="text-xs text-dim">
                          {format(new Date(m.createdAt), 'dd MMM yyyy, HH:mm')}
                        </div>
                      </div>
                      <div className="text-sm text-text mb-2">{m.reason}</div>
                      <div className="text-xs text-muted flex items-center gap-1">
                        Recorded by <span className="font-medium text-text">{m.user.name}</span>
                        <span className="badge badge-neutral ml-1" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                          {m.user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border bg-surface-2 flex items-center justify-between">
            <span className="text-xs text-muted">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                className="btn btn-secondary btn-sm px-2" 
                disabled={!pagination.hasPrevPage} 
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="btn btn-secondary btn-sm px-2" 
                disabled={!pagination.hasNextPage} 
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
