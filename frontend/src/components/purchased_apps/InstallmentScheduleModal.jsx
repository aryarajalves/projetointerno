import React from 'react';

export function InstallmentScheduleModal({ app, onClose, onToggleStatus, formatCurrency, formatDate }) {
  if (!app) return null;

  return (
    <div className="modal-backdrop" data-testid="view-installments-modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
            📅 Cronograma de Parcelas - {app.app_name}
          </h2>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Valor Total: <strong style={{ color: 'var(--emerald-primary)' }}>{formatCurrency(app.price)}</strong> ({app.installments?.length || 0} parcelas)
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.4rem' }}>
          {app.installments && app.installments.map((inst) => (
            <div 
              key={inst.id}
              style={{
                background: 'var(--bg-card-inner)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>
                  Parcela {inst.installment_number} de {app.installments.length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Vencimento: <strong style={{ color: '#fff' }}>{formatDate(inst.due_date)}</strong>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--emerald-primary)', marginTop: '0.2rem' }}>
                  {formatCurrency(inst.amount)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleStatus(app.id, inst.id, inst.status)}
                className={`btn ${inst.status === 'paid' ? 'btn-emerald' : 'btn-dark'}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                {inst.status === 'paid' ? '✓ Paga' : '⏳ Marcar Paga'}
              </button>
            </div>
          ))}
        </div>

        <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-dark" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
