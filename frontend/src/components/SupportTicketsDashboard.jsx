import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';
import { SupportTicketModal } from './support_tickets/SupportTicketModal';
import { SupportTicketFilterTabs } from './support_tickets/SupportTicketFilterTabs';
import { SupportTicketsPagination } from './support_tickets/SupportTicketsPagination';

export function SupportTicketsDashboard({ clientId, clientName, currentUser }) {
  const toastCtx = useToast();
  const showToast = toastCtx?.showToast;

  const [allTickets, setAllTickets] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('open'); // Default: 'open' ('Abertos')
  const [clientFilter, setClientFilter] = useState('Todos');
  const [search, setSearch] = useState('');

  // Paginação State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modais State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState(clientId ? clientId.toString() : '');
  const [selectedApp, setSelectedApp] = useState('AgentFlow');
  const [ticketType, setTicketType] = useState('bug');
  const [priority, setPriority] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [modalDueDate, setModalDueDate] = useState('');
  const [attachments, setAttachments] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const openCreateModal = () => {
    setEditingTicket(null);
    if (!clientId && clients.length > 0) {
      setSelectedClientId(clients[0].id.toString());
    } else if (clientId) {
      setSelectedClientId(clientId.toString());
    }
    setSelectedApp('AgentFlow');
    setTicketType('bug');
    setPriority('medium');
    setTitle('');
    setDescription('');
    setDueDate('');
    setAttachments([]);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (ticket) => {
    setEditingTicket(ticket);
    setSelectedClientId(ticket.client_id ? ticket.client_id.toString() : '');
    setSelectedApp(ticket.app_name || 'AgentFlow');
    setTicketType(ticket.ticket_type || 'bug');
    setPriority(ticket.priority || 'medium');
    setTitle(ticket.title || '');
    setDescription(ticket.description || '');
    setDueDate(ticket.due_date ? new Date(ticket.due_date).toISOString().slice(0, 16) : '');
    setAttachments(ticket.attachments || []);
    setIsCreateModalOpen(true);
  };

  useEffect(() => {
    if (selectedTicket) {
      if (selectedTicket.due_date) {
        setModalDueDate(new Date(selectedTicket.due_date).toISOString().slice(0, 16));
      } else {
        setModalDueDate('');
      }
    }
  }, [selectedTicket]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Sem prazo definido';
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

  // Retorna { color, icon, label, bg, isOverdue, isUrgent }
  const getDueDateStatus = (dateStr) => {
    if (!dateStr) return null;
    const now = new Date();
    const due = new Date(dateStr);
    const diffMs = due - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffMs < 0) {
      // VENCIDO
      return { color: '#ef4444', icon: '🚨', bg: 'rgba(239,68,68,0.15)', border: '#ef4444', label: 'VENCIDO', isOverdue: true };
    } else if (diffHours <= 24) {
      // MENOS DE 1 DIA
      return { color: '#f97316', icon: '⚠️', bg: 'rgba(249,115,22,0.15)', border: '#f97316', label: 'URGENTE', isUrgent: true };
    } else if (diffHours <= 72) {
      // MENOS DE 3 DIAS
      return { color: '#eab308', icon: '⏳', bg: 'rgba(234,179,8,0.1)', border: '#eab308', label: 'PRÓXIMO', isSoon: true };
    } else {
      // DENTRO DO PRAZO
      return { color: '#10b981', icon: '✅', bg: 'rgba(16,185,129,0.08)', border: '#10b981', label: 'NO PRAZO', isOk: true };
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...(clientId && { client_id: clientId.toString() }),
        ...(typeFilter !== 'Todos' && { type_filter: typeFilter }),
        ...(search && { search })
      });
      const res = await fetch(`${API_URL}/api/tickets/?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAllTickets(data);
      }
    } catch (err) {
      console.error("Erro ao carregar tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const url = `${API_URL}/api/clients/?limit=100${currentUser?.id ? `&user_id=${currentUser.id}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setClients(data.items || []);
        if (clientId) {
          setSelectedClientId(clientId.toString());
        } else if (data.items && data.items.length > 0) {
          setSelectedClientId(data.items[0].id.toString());
        }
      }
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [clientId]);

  useEffect(() => {
    fetchTickets();
  }, [clientId, typeFilter, search]);

  useEffect(() => {
    if (clientFilter !== 'Todos') {
      const exists = allTickets.some(t => 
        t.client_id === parseInt(clientFilter, 10) && 
        (statusFilter === 'Todos' || t.status === statusFilter)
      );
      if (!exists) {
        setClientFilter('Todos');
      }
    }
  }, [statusFilter, allTickets, clientFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, clientFilter, search, itemsPerPage]);

  // Contadores para as abas por status
  const statusCounts = {
    all: allTickets.length,
    open: allTickets.filter(t => t.status === 'open').length,
    in_progress: allTickets.filter(t => t.status === 'in_progress').length,
    resolved: allTickets.filter(t => t.status === 'resolved').length
  };

  // Filtragem por status nas abas e por cliente
  const filteredTickets = allTickets.filter(t => {
    const matchStatus = statusFilter === 'Todos' || t.status === statusFilter;
    const matchClient = !clientId && clientFilter !== 'Todos' ? t.client_id === parseInt(clientFilter, 10) : true;
    return matchStatus && matchClient;
  });

  // Paginação
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [
          ...prev,
          {
            file_name: file.name,
            file_type: file.type || 'image/png',
            file_data: reader.result
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSaveTicket = async (e) => {
    e.preventDefault();
    if (!selectedClientId || !title.trim()) {
      alert('Por favor, preencha o cliente e o título do ticket.');
      return;
    }

    try {
      const payload = {
        client_id: parseInt(selectedClientId, 10),
        app_name: selectedApp,
        ticket_type: ticketType,
        priority,
        title,
        description,
        created_by_id: currentUser?.id || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        attachments
      };

      const url = editingTicket 
        ? `${API_URL}/api/tickets/${editingTicket.id}`
        : `${API_URL}/api/tickets/`;

      const method = editingTicket ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        setIsCreateModalOpen(false);
        if (editingTicket && selectedTicket && selectedTicket.id === editingTicket.id) {
          setSelectedTicket(updated);
        }
        setEditingTicket(null);
        setTitle('');
        setDescription('');
        setDueDate('');
        setAttachments([]);
        if (showToast) showToast(editingTicket ? 'Ticket atualizado com sucesso!' : 'Ticket de suporte criado com sucesso!', 'success');
        fetchTickets();
      } else {
        alert('Erro ao salvar ticket.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar ticket.');
    }
  };

  const handleUpdateDueDate = async (ticketId, newDueDateStr) => {
    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ due_date: newDueDateStr ? new Date(newDueDateStr).toISOString() : null })
      });

      if (res.ok) {
        const updated = await res.json();
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(updated);
        }
        if (showToast) showToast('Prazo de conclusão atualizado!', 'success');
        fetchTickets();
      }
    } catch (err) {
      alert('Erro ao atualizar prazo do ticket.');
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(updated);
        }
        if (showToast) showToast('Status do ticket atualizado!', 'success');
        fetchTickets();
      }
    } catch (err) {
      alert('Erro ao atualizar status do ticket.');
    }
  };

  const confirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticketToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTicketToDelete(null);
        if (selectedTicket && selectedTicket.id === ticketToDelete) {
          setSelectedTicket(null);
        }
        if (showToast) showToast('Ticket excluído com sucesso!', 'success');
        fetchTickets();
      }
    } catch (err) {
      alert('Erro ao excluir ticket.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="badge badge-lead" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444' }}>🔴 Aberto</span>;
      case 'in_progress':
        return <span className="badge badge-lead" style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid #eab308' }}>⚡ Em Andamento</span>;
      case 'resolved':
        return <span className="badge badge-cliente">✓ Resolvido</span>;
      case 'closed':
        return <span className="badge badge-inativo">⚪ Fechado</span>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type) => {
    return type === 'bug' ? (
      <span className="badge badge-lead" style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid #f43f5e' }}>🐛 Bug</span>
    ) : (
      <span className="badge badge-lead" style={{ backgroundColor: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', border: '1px solid #38bdf8' }}>💡 Melhoria</span>
    );
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Topo / Header da Central de Suporte */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🎫 Central de Tickets de Suporte
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {clientName ? `Gerencie relatórios de problemas e melhorias do cliente ${clientName}.` : 'Gerencie relatórios de problemas, pedidos de melhoria e anexos de cada cliente.'}
          </p>
        </div>
        <button 
          type="button"
          className="btn btn-emerald" 
          onClick={openCreateModal}
          data-testid="open-create-ticket-modal-btn"
        >
          + NOVO TICKET DE SUPORTE
        </button>
      </div>

      {/* Abas por Status e Filtros */}
      <SupportTicketFilterTabs 
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        clientFilter={clientFilter}
        setClientFilter={setClientFilter}
        clients={clients}
        allTickets={allTickets}
        isClientView={!!clientId}
        search={search}
        setSearch={setSearch}
        statusCounts={statusCounts}
      />

      {/* Grid de Tickets */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Carregando tickets de suporte...</p>
      ) : filteredTickets.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '3rem', borderRadius: '14px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Nenhum ticket de suporte encontrado nesta aba.</p>
          <p style={{ fontSize: '0.85rem' }}>Clique em "+ NOVO TICKET DE SUPORTE" para registrar um chamado.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {paginatedTickets.map((t) => {
              const dueSt = getDueDateStatus(t.due_date);
              return (
              <div 
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                style={{
                  background: dueSt?.isOverdue ? 'rgba(239,68,68,0.06)' : 'var(--bg-card-inner)',
                  border: `1px solid ${dueSt?.isOverdue ? '#ef4444' : dueSt?.isUrgent ? '#f97316' : 'var(--border-color)'}`,
                  borderRadius: '14px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  boxShadow: dueSt?.isOverdue ? '0 0 12px rgba(239,68,68,0.25)' : dueSt?.isUrgent ? '0 0 8px rgba(249,115,22,0.15)' : 'none'
                }}
                data-testid={`ticket-card-${t.id}`}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    {getTypeBadge(t.ticket_type)}
                    {getStatusBadge(t.status)}
                  </div>

                  {/* Banner de alerta de vencimento */}
                  {dueSt?.isOverdue && (
                    <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '0.35rem 0.75rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#ef4444' }}>
                      🚨 PRAZO VENCIDO — {formatDateTime(t.due_date)}
                    </div>
                  )}
                  {dueSt?.isUrgent && !dueSt.isOverdue && (
                    <div style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid #f97316', borderRadius: '8px', padding: '0.35rem 0.75rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#f97316' }}>
                      ⚠️ MENOS DE 1 DIA — {formatDateTime(t.due_date)}
                    </div>
                  )}

                  <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: '800', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                    {t.title}
                  </h3>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {t.description || 'Sem descrição.'}
                  </p>
                </div>

                <div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div>
                      <div>👤 <strong style={{ color: '#fff' }}>{t.client_name}</strong></div>
                      <div style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>✍️ Criado por: <span style={{ color: '#fff' }}>{t.created_by_name || 'Super Admin'}</span></div>
                      {t.due_date && !dueSt?.isOverdue && !dueSt?.isUrgent && (
                        <div style={{ fontSize: '0.7rem', color: dueSt?.color || 'var(--text-muted)', marginTop: '0.2rem', fontWeight: '600' }}>
                          {dueSt?.icon} Prazo: {formatDateTime(t.due_date)}
                        </div>
                      )}
                    </div>
                    {t.attachments && t.attachments.length > 0 && (
                      <span style={{ color: 'var(--emerald-primary)', fontWeight: '700' }}>
                        🖼️ {t.attachments.length} anexo(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {/* Componente de Paginação */}
          <SupportTicketsPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={filteredTickets.length}
          />
        </>
      )}

      {/* Componente de Modais (Criação, Edição, Detalhes, Deleção) */}
      <SupportTicketModal 
        selectedTicket={selectedTicket}
        setSelectedTicket={setSelectedTicket}
        editingTicket={editingTicket}
        openEditModal={openEditModal}
        handleUpdateStatus={handleUpdateStatus}
        setTicketToDelete={setTicketToDelete}
        ticketToDelete={ticketToDelete}
        confirmDeleteTicket={confirmDeleteTicket}
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        handleCreateTicket={handleSaveTicket}
        clientId={clientId}
        clientName={clientName}
        selectedClientId={selectedClientId}
        setSelectedClientId={setSelectedClientId}
        clients={clients}
        selectedApp={selectedApp}
        setSelectedApp={setSelectedApp}
        ticketType={ticketType}
        setTicketType={setTicketType}
        priority={priority}
        setPriority={setPriority}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        dueDate={dueDate}
        setDueDate={setDueDate}
        modalDueDate={modalDueDate}
        setModalDueDate={setModalDueDate}
        handleUpdateDueDate={handleUpdateDueDate}
        currentUser={currentUser}
        formatDateTime={formatDateTime}
        getDueDateStatus={getDueDateStatus}
        attachments={attachments}
        setAttachments={setAttachments}
        handleFileUpload={handleFileUpload}
        getTypeBadge={getTypeBadge}
        getStatusBadge={getStatusBadge}
      />
    </div>
  );
}
