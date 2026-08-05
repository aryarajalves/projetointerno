import React from 'react';

export function SupportTicketsPagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems
}) {
  if (totalItems === 0) return null;

  return (
    <div style={{ 
      display: 'flex', 
      justify: 'space-between', 
      alignItems: 'center', 
      marginTop: '1.5rem', 
      paddingTop: '1rem',
      borderTop: '1px solid var(--border-color)',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Mostrando <strong style={{ color: '#fff' }}>{Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)}</strong> até <strong style={{ color: '#fff' }}>{Math.min(totalItems, currentPage * itemsPerPage)}</strong> de <strong style={{ color: 'var(--emerald-primary)' }}>{totalItems}</strong> tickets
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>Exibir:</span>
          <select 
            value={itemsPerPage} 
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            data-testid="tickets-limit-select"
            style={{ fontSize: '0.85rem', padding: '0.4rem 2rem 0.4rem 0.75rem' }}
          >
            <option value={10}>10 por página</option>
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', opacity: currentPage <= 1 ? 0.5 : 1 }}
            data-testid="pagination-prev-btn"
          >
            &larr; Anterior
          </button>
          
          <span style={{ fontSize: '0.85rem', color: '#fff', padding: '0 0.5rem', fontWeight: '700' }}>
            {currentPage} / {totalPages || 1}
          </span>

          <button
            type="button"
            className="btn btn-dark"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', opacity: currentPage >= totalPages ? 0.5 : 1 }}
            data-testid="pagination-next-btn"
          >
            Próxima &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
