import React, { useState } from 'react';

const ALL_APPS = [
  { name: 'AgentFlow', icon: '🤖' },
  { name: 'ZapJords', icon: '⚡' },
  { name: 'Oraculo', icon: '🔮' },
  { name: 'ZapGroup', icon: '👥' },
  { name: 'Outro', icon: '💻' }
];

function SearchableClientSelect({ clients = [], selectedClientId, setSelectedClientId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedClient = clients.find(c => c.id.toString() === selectedClientId?.toString());

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Campo visível do Select / Combobox */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          padding: '0.65rem 0.85rem',
          backgroundColor: 'var(--bg-card-inner)',
          color: '#fff',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: '500'
        }}
        data-testid="ticket-client-select"
      >
        <span>{selectedClient ? `${selectedClient.name} (${selectedClient.type})` : 'Selecione um cliente...'}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {/* Menu suspenso de busca */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1000,
          marginTop: '0.25rem',
          backgroundColor: '#151e32',
          border: '1px solid var(--emerald-primary)',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          padding: '0.5rem',
          maxHeight: '260px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          <input 
            type="text"
            placeholder="🔍 Digite para pesquisar o nome do cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              backgroundColor: '#0b1120',
              color: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              outline: 'none'
            }}
            data-testid="ticket-client-search-input"
          />

          <div style={{ overflowY: 'auto', maxHeight: '190px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {filteredClients.length === 0 ? (
              <div style={{ padding: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Nenhum cliente encontrado com "{searchTerm}"
              </div>
            ) : (
              filteredClients.map(c => {
                const isSelected = c.id.toString() === selectedClientId?.toString();
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedClientId(c.id.toString());
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      backgroundColor: isSelected ? 'rgba(16,185,129,0.2)' : 'transparent',
                      color: isSelected ? 'var(--emerald-primary)' : '#fff',
                      fontWeight: isSelected ? '700' : '500',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isSelected ? 'rgba(16,185,129,0.25)' : '#0b1120'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? 'rgba(16,185,129,0.2)' : 'transparent'}
                  >
                    {c.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({c.type})</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SupportTicketModal({
  selectedTicket,
  setSelectedTicket,
  editingTicket,
  openEditModal,
  handleUpdateStatus,
  setTicketToDelete,
  ticketToDelete,
  confirmDeleteTicket,
  isCreateModalOpen,
  setIsCreateModalOpen,
  handleCreateTicket,
  clientId,
  clientName,
  selectedClientId,
  setSelectedClientId,
  clients,
  selectedApp,
  setSelectedApp,
  ticketType,
  setTicketType,
  priority,
  setPriority,
  title,
  setTitle,
  description,
  setDescription,
  dueDate,
  setDueDate,
  modalDueDate,
  setModalDueDate,
  handleUpdateDueDate,
  currentUser,
  formatDateTime,
  getDueDateStatus,
  attachments,
  setAttachments,
  handleFileUpload,
  getTypeBadge,
  getStatusBadge
}) {
  const canManageDueDate = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  return (
    <>
      {/* Modal de Detalhes do Ticket */}
      {selectedTicket && (() => {
        const dueSt = getDueDateStatus ? getDueDateStatus(selectedTicket.due_date) : null;
        return (
        <div className="modal-backdrop" data-testid="ticket-detail-modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '640px', border: dueSt?.isOverdue ? '1px solid #ef4444' : dueSt?.isUrgent ? '1px solid #f97316' : undefined }}>
            {/* Alerta de prazo vencido/urgente */}
            {dueSt?.isOverdue && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '0.5rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#ef4444' }}>
                🚨 PRAZO VENCIDO — Este ticket ultrapassou o prazo de conclusão em {formatDateTime(selectedTicket.due_date)}
              </div>
            )}
            {dueSt?.isUrgent && !dueSt.isOverdue && (
              <div style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid #f97316', borderRadius: '8px', padding: '0.5rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#f97316' }}>
                ⚠️ ATENÇÃO — Menos de 1 dia para o prazo de conclusão!
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getTypeBadge(selectedTicket.ticket_type)}
                {getStatusBadge(selectedTicket.status)}
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedTicket(null)} 
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#fff' }}>
              {selectedTicket.title}
            </h2>

            <div style={{ background: 'var(--bg-card-inner)', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <div>Cliente: <strong style={{ color: '#fff' }}>{selectedTicket.client_name}</strong></div>
              <div>Ferramenta: <strong style={{ color: '#fff' }}>{selectedTicket.app_name}</strong></div>
              <div>Criado por: <strong style={{ color: '#fff' }}>{selectedTicket.created_by_name || 'Super Admin'}</strong></div>
              
              <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>⏰ Prazo de Conclusão: <strong style={{ color: selectedTicket.due_date ? 'var(--emerald-primary)' : '#eab308' }}>{formatDateTime(selectedTicket.due_date)}</strong></div>
                {canManageDueDate && (
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    <input 
                      type="datetime-local" 
                      value={modalDueDate}
                      onChange={(e) => setModalDueDate(e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', width: '170px' }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-emerald" 
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => handleUpdateDueDate(selectedTicket.id, modalDueDate)}
                    >
                      Salvar Prazo
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                DESCRIÇÃO DETALHADA DO OCORRIDO
              </label>
              <div style={{ background: 'var(--bg-card-inner)', padding: '1rem', borderRadius: '10px', marginTop: '0.4rem', color: '#fff', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                {selectedTicket.description || 'Nenhuma descrição fornecida.'}
              </div>
            </div>

            {/* Imagens Anexadas */}
            {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                  IMAGENS E ANEXOS ({selectedTicket.attachments.length})
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {selectedTicket.attachments.map(att => (
                    <a key={att.id} href={att.file_data} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={att.file_data} alt={att.file_name} style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Ações de Status e Edição */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-dark" onClick={() => handleUpdateStatus(selectedTicket.id, 'open')} style={{ fontSize: '0.8rem' }}>
                  🔴 Aberto
                </button>
                <button type="button" className="btn btn-dark" onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')} style={{ fontSize: '0.8rem' }}>
                  ⚡ Em Andamento
                </button>
                <button type="button" className="btn btn-emerald" onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')} style={{ fontSize: '0.8rem' }}>
                  ✓ Resolvido
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="btn btn-dark" 
                  onClick={() => openEditModal(selectedTicket)} 
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                  data-testid="edit-ticket-modal-btn"
                >
                  ✏️ Editar
                </button>
                <button type="button" onClick={() => setTicketToDelete(selectedTicket.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>
                  🗑️ Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Modal de Confirmação de Deleção */}
      {ticketToDelete && (
        <div className="modal-backdrop" data-testid="delete-ticket-modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ color: 'var(--badge-red-text)', marginBottom: '0.75rem' }}>Confirmar Exclusão</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Tem certeza que deseja excluir este ticket de suporte?
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-dark" onClick={() => setTicketToDelete(null)}>Cancelar</button>
              <button type="button" className="btn btn-dark" onClick={confirmDeleteTicket} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}>
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação de Ticket */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" data-testid="create-ticket-modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <h2>{editingTicket ? 'Editar Ticket de Suporte' : 'Novo Ticket de Suporte'}</h2>
            <form onSubmit={handleCreateTicket}>
              {/* Campo CLIENTE: oculto se já estiver dentro de um cliente específico */}
              {clientId ? (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>CLIENTE</label>
                  <div style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🔒 <strong>{clientName || 'Cliente Selecionado'}</strong>
                  </div>
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>CLIENTE *</label>
                  <SearchableClientSelect 
                    clients={clients}
                    selectedClientId={selectedClientId}
                    setSelectedClientId={setSelectedClientId}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>FERRAMENTA / APLICAÇÃO *</label>
                  <select value={selectedApp} onChange={(e) => setSelectedApp(e.target.value)}>
                    {ALL_APPS.map(a => (
                      <option key={a.name} value={a.name}>{a.icon} {a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>CATEGORIA *</label>
                  <select value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
                    <option value="bug">🐛 Problema / Bug</option>
                    <option value="enhancement">💡 Pedido de Melhoria</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>NÍVEL DE URGÊNCIA *</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="low">🟢 Baixa</option>
                  <option value="medium">🟡 Média</option>
                  <option value="high">🟠 Alta</option>
                  <option value="urgent">🔴 Urgente</option>
                </select>
              </div>

              {canManageDueDate && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>PRAZO DE CONCLUSÃO (DATA E HORÁRIO)</label>
                  <input 
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{ marginTop: '0.4rem', width: '100%' }}
                    data-testid="ticket-due-date-form-input"
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>TÍTULO DO TICKET *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Resumo claro do problema ou melhoria..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="ticket-title-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>DESCRIÇÃO DETALHADA DO OCORRIDO</label>
                <textarea 
                  rows={4}
                  placeholder="Explique com detalhes o que aconteceu ou o que precisa ser melhorado..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Anexo de Imagens */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>ANEXAR IMAGENS / PRINTS</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFileUpload} 
                  style={{ marginTop: '0.4rem', fontSize: '0.85rem' }} 
                />
                {attachments.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    {attachments.map((att, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <img src={att.file_data} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          type="button" 
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-dark" onClick={() => setIsCreateModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-emerald" data-testid="save-ticket-btn">{editingTicket ? 'Salvar Alterações' : 'Criar Ticket'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
