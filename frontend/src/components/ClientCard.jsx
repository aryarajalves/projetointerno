import React from 'react';

export function ClientCard({ client, onClick, onEdit, onDelete, onTogglePin }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Hoje';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' às ' + date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(client.id);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(client);
  };

  const handlePinClick = (e) => {
    e.stopPropagation();
    if (onTogglePin) onTogglePin(client.id);
  };

  const isLead = client.type === 'Lead';
  const isPinned = !!client.is_pinned;

  return (
    <div 
      className={`client-card ${isLead ? 'card-lead' : 'card-cliente'}`} 
      onClick={() => onClick(client)} 
      style={{
        border: isPinned ? '1px solid #eab308' : undefined,
        boxShadow: isPinned ? '0 0 10px rgba(234, 179, 8, 0.2)' : undefined,
        position: 'relative'
      }}
      data-testid={`client-card-${client.id}`}
    >
      <div className="client-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            {isPinned && <span style={{ fontSize: '0.85rem' }} title="Contato Fixado">📌</span>}
            <span className="client-name">{client.name}</span>
            <span className={`badge ${isLead ? 'badge-lead' : 'badge-cliente'}`}>
              {isLead ? '🎯 Lead' : '✅ Cliente'}
            </span>
          </div>
          <div className="client-date">📅 Cadastrado em: {formatDate(client.created_at)}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {onTogglePin && (
            <button 
              className="action-card-btn" 
              onClick={handlePinClick} 
              title={isPinned ? "Desfixar do topo" : "Fixar no topo (máx 10)"}
              style={{
                color: isPinned ? '#eab308' : 'var(--text-muted)',
                background: isPinned ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
                borderColor: isPinned ? '#eab308' : 'transparent'
              }}
              data-testid={`pin-client-btn-${client.id}`}
            >
              📌
            </button>
          )}
          <button 
            className="action-card-btn" 
            onClick={handleEditClick} 
            title="Editar contato"
            data-testid={`edit-client-btn-${client.id}`}
          >
            ✏️
          </button>
          <button 
            className="action-card-btn" 
            onClick={handleDeleteClick} 
            title="Excluir contato"
            data-testid={`delete-client-btn-${client.id}`}
          >
            🗑️
          </button>
        </div>
      </div>

      {client.notes && (
        <div className="client-notes-preview">
          📝 {client.notes}
        </div>
      )}
    </div>
  );
}
