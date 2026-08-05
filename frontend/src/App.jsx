import React, { useState, useEffect } from 'react';
import { ClientCard } from './components/ClientCard';
import { ClientFormModal } from './components/ClientFormModal';
import { ClientEditModal } from './components/ClientEditModal';
import { ClientDetail } from './components/ClientDetail';
import { ToastProvider } from './components/Toast';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { FinancialDashboard } from './components/FinancialDashboard';
import { UserManagementDashboard } from './components/UserManagementDashboard';
import { SupportTicketsDashboard } from './components/SupportTicketsDashboard';
import { StackUpdateDashboard } from './components/StackUpdateDashboard';
import { InviteRegisterModal } from './components/InviteRegisterModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('auth_user');
      return (savedUser && savedUser !== 'undefined') ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeMainTab, setActiveMainTab] = useState(() => {
    const savedTab = localStorage.getItem('activeMainTab');
    return (savedTab && savedTab !== 'undefined') ? savedTab : 'contacts';
  });
  const [inviteToken, setInviteToken] = useState(null);

  const handleSelectTab = (tab) => {
    setActiveMainTab(tab);
    localStorage.setItem('activeMainTab', tab);
    setShowAdvancedFilters(false);
  };

  useEffect(() => {
    setShowAdvancedFilters(false);
  }, [activeMainTab]);

  useEffect(() => {
    // Verificar se há token de convite na URL (/invite/TOKEN)
    const path = window.location.pathname;
    if (path.startsWith('/invite/')) {
      const token = path.split('/invite/')[1];
      if (token) setInviteToken(token);
    }
  }, []);

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [createdDate, setCreatedDate] = useState('');
  const [contactType, setContactType] = useState('Todos');
  const [hasCredentialsFilter, setHasCredentialsFilter] = useState(false);
  const [hasTicketsFilter, setHasTicketsFilter] = useState(false);
  const [hasTasksFilter, setHasTasksFilter] = useState(false);
  const [orderBy, setOrderBy] = useState('name_asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Confirmation Modal for Deleting
  const [clientToDelete, setClientToDelete] = useState(null);

  const fetchClients = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        order_by: orderBy,
        ...(currentUser?.id && { user_id: currentUser.id.toString() }),
        ...(search && { search }),
        ...(createdDate && { created_date: createdDate }),
        ...(contactType !== 'Todos' && { contact_type: contactType }),
        ...(hasCredentialsFilter && { has_credentials: 'true' }),
        ...(hasTicketsFilter && { has_tickets: 'true' }),
        ...(hasTasksFilter && { has_tasks: 'true' })
      });

      const res = await fetch(`${API_URL}/api/clients/?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Falha ao carregar contatos');
      const data = await res.json();
      
      setClients(data.items);
      setTotal(data.total);
      setTotalPages(data.pages);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível conectar com o servidor backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && activeMainTab === 'contacts') {
      fetchClients();
    }
  }, [currentUser, activeMainTab, page, limit, search, createdDate, contactType, hasCredentialsFilter, hasTicketsFilter, hasTasksFilter, orderBy]);

  const handleLoginSuccess = (token, user) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setCurrentUser(null);
    setSelectedClient(null);
  };

  if (!currentUser) {
    return (
      <ToastProvider>
        <Login onLoginSuccess={handleLoginSuccess} />
        {inviteToken && (
          <InviteRegisterModal 
            token={inviteToken} 
            onClose={() => {
              setInviteToken(null);
              window.history.pushState({}, '', '/');
            }} 
            onRegisterSuccess={() => {
              setInviteToken(null);
              window.history.pushState({}, '', '/');
            }} 
          />
        )}
      </ToastProvider>
    );
  }

  const handleCreateClient = async (newClientData) => {
    try {
      const res = await fetch(`${API_URL}/api/clients/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientData)
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || 'Erro ao criar contato');
        return;
      }

      await fetchClients();
    } catch (err) {
      alert('Erro de conexão ao salvar contato');
    }
  };

  const handleSaveEditClient = async (clientId, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (res.ok) {
        const updated = await res.json();
        if (selectedClient && selectedClient.id === clientId) {
          setSelectedClient(updated);
        }
        await fetchClients();
      } else {
        alert('Erro ao atualizar dados do contato');
      }
    } catch (err) {
      alert('Erro de conexão ao atualizar contato');
    }
  };

  const handleUpdateType = async (clientId, newType) => {
    await handleSaveEditClient(clientId, { type: newType });
  };

  const handleTogglePinClient = async (clientId) => {
    try {
      const res = await fetch(`${API_URL}/api/clients/${clientId}/pin`, {
        method: 'POST'
      });

      if (res.ok) {
        await fetchClients();
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Erro ao fixar/desfixar contato');
      }
    } catch (err) {
      alert('Erro de conexão ao alterar fixação do contato');
    }
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      const res = await fetch(`${API_URL}/api/clients/${clientToDelete}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        if (selectedClient && selectedClient.id === clientToDelete) {
          setSelectedClient(null);
        }
        setClientToDelete(null);
        await fetchClients();
      }
    } catch (err) {
      alert('Erro ao excluir contato');
    }
  };

  return (
    <ToastProvider>
      <div className="app-container">
        {/* Renderiza a Barra Lateral Principal apenas quando NÃO houver um cliente selecionado */}
        {!selectedClient && (
          <Sidebar 
            activeTab={activeMainTab}
            onSelectTab={handleSelectTab}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        )}

        <main className="main-content" style={{ marginLeft: selectedClient ? '0' : '260px', transition: 'margin-left 0.3s ease' }}>
          {inviteToken && (
            <InviteRegisterModal 
              token={inviteToken} 
              onClose={() => { setInviteToken(null); window.history.pushState({}, '', '/'); }}
              onRegisterSuccess={() => { setInviteToken(null); window.history.pushState({}, '', '/'); }}
            />
          )}

          {selectedClient ? (
            <ClientDetail 
              client={selectedClient} 
              onBack={() => setSelectedClient(null)} 
              onEdit={(client) => setClientToEdit(client)}
              onDelete={(id) => setClientToDelete(id)}
              onUpdateType={handleUpdateType}
              currentUser={currentUser}
            />
          ) : activeMainTab === 'finance' ? (
            <FinancialDashboard />
          ) : activeMainTab === 'tickets' && currentUser?.role !== 'USER' ? (
            <SupportTicketsDashboard currentUser={currentUser} />
          ) : activeMainTab === 'users' && currentUser?.role === 'SUPER_ADMIN' ? (
            <UserManagementDashboard />
          ) : activeMainTab === 'stack-update' && currentUser?.role === 'SUPER_ADMIN' ? (
            <StackUpdateDashboard currentUser={currentUser} />
          ) : (
            <>
              <div className="hero-header">
                <div className="hero-title-group">
                  <div className="icon-circle-emerald">📇</div>
                  <div>
                    <h1 className="hero-title">Gestão de Contatos</h1>
                    <p className="hero-desc">Gerencie Leads e Clientes, edite informações e filtre por senhas salvas.</p>
                  </div>
                </div>
                <div>
                  <button 
                    className="btn btn-emerald" 
                    onClick={() => setIsModalOpen(true)}
                    data-testid="add-client-btn"
                  >
                    + NOVO CONTATO
                  </button>
                </div>
              </div>

              {/* Toolbar com Filtros Básicos e Painel de Filtros Avançados */}
              <div className="toolbar-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input 
                      type="text" 
                      placeholder="Pesquisar por nome ou observação..." 
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      data-testid="search-input"
                    />
                  </div>

                  <div className="filter-group">
                    <div className="filter-item">
                      <label htmlFor="contactTypeSelect">Tipo:</label>
                      <select 
                        id="contactTypeSelect"
                        value={contactType} 
                        onChange={(e) => { setContactType(e.target.value); setPage(1); }}
                        data-testid="type-filter"
                      >
                        <option value="Todos">Todos os Tipos</option>
                        <option value="Lead">🎯 Somente Leads</option>
                        <option value="Cliente">✅ Somente Clientes</option>
                      </select>
                    </div>

                    <button 
                      type="button"
                      className={`btn ${showAdvancedFilters ? 'btn-emerald' : 'btn-dark'}`}
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      style={{ fontSize: '0.85rem' }}
                      data-testid="toggle-advanced-filters-btn"
                    >
                      🎛️ Filtros Avançados {showAdvancedFilters ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Painel Expansível de Filtros Avançados */}
                {showAdvancedFilters && (
                  <div style={{ 
                    paddingTop: '1rem', 
                    borderTop: '1px solid var(--border-color)', 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '1rem', 
                    alignItems: 'center' 
                  }}>
                    <div className="filter-item" style={{ background: 'var(--bg-card-inner)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasCredentialsFilter ? 'var(--emerald-primary)' : 'var(--text-muted)', fontWeight: hasCredentialsFilter ? '700' : '500' }}>
                        <input 
                          type="checkbox"
                          checked={hasCredentialsFilter}
                          onChange={(e) => { setHasCredentialsFilter(e.target.checked); setPage(1); }}
                          style={{ accentColor: 'var(--emerald-primary)', cursor: 'pointer' }}
                          data-testid="has-credentials-checkbox"
                        />
                        🔑 Com Senhas Anotadas
                      </label>
                    </div>

                    <div className="filter-item" style={{ background: 'var(--bg-card-inner)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasTicketsFilter ? 'var(--emerald-primary)' : 'var(--text-muted)', fontWeight: hasTicketsFilter ? '700' : '500' }}>
                        <input 
                          type="checkbox"
                          checked={hasTicketsFilter}
                          onChange={(e) => { setHasTicketsFilter(e.target.checked); setPage(1); }}
                          style={{ accentColor: 'var(--emerald-primary)', cursor: 'pointer' }}
                          data-testid="has-tickets-checkbox"
                        />
                        🎫 Com Tickets Criados
                      </label>
                    </div>

                    <div className="filter-item" style={{ background: 'var(--bg-card-inner)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasTasksFilter ? 'var(--emerald-primary)' : 'var(--text-muted)', fontWeight: hasTasksFilter ? '700' : '500' }}>
                        <input 
                          type="checkbox"
                          checked={hasTasksFilter}
                          onChange={(e) => { setHasTasksFilter(e.target.checked); setPage(1); }}
                          style={{ accentColor: 'var(--emerald-primary)', cursor: 'pointer' }}
                          data-testid="has-tasks-checkbox"
                        />
                        📋 Com Demanda no Trello
                      </label>
                    </div>

                    <div className="filter-item">
                      <label htmlFor="orderBySelect">Ordem:</label>
                      <select 
                        id="orderBySelect"
                        value={orderBy} 
                        onChange={(e) => { setOrderBy(e.target.value); setPage(1); }}
                        data-testid="order-by-select"
                      >
                        <option value="name_asc">Nome (A - Z)</option>
                        <option value="name_desc">Nome (Z - A)</option>
                        <option value="date_desc">Mais Recentes</option>
                        <option value="date_asc">Mais Antigos</option>
                      </select>
                    </div>

                    <div className="filter-item">
                      <label htmlFor="createdDateFilter">Data:</label>
                      <input 
                        id="createdDateFilter"
                        type="date" 
                        value={createdDate}
                        onChange={(e) => { setCreatedDate(e.target.value); setPage(1); }}
                        data-testid="date-filter"
                      />
                      {createdDate && (
                        <button 
                          type="button"
                          className="btn btn-dark" 
                          onClick={() => setCreatedDate('')}
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    <div className="filter-item">
                      <label htmlFor="limitSelect">Exibir:</label>
                      <select 
                        id="limitSelect"
                        value={limit} 
                        onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                        data-testid="limit-select"
                      >
                        <option value={10}>10 por página</option>
                        <option value={25}>25 por página</option>
                        <option value={50}>50 por página</option>
                        <option value={100}>100 por página</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {loading ? (
                <p style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>Carregando contatos...</p>
              ) : error ? (
                <div style={{ color: 'var(--badge-red-text)', background: 'var(--badge-red-bg)', padding: '1rem', borderRadius: '8px' }}>
                  {error}
                </div>
              ) : clients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>Nenhum contato encontrado</h3>
                  <p>{search || createdDate || contactType !== 'Todos' || hasCredentialsFilter ? 'Tente alterar ou limpar os filtros de busca.' : 'Clique em "+ NOVO CONTATO" para adicionar o primeiro registro à base.'}</p>
                </div>
              ) : (
                <>
                  <div className="clients-grid" data-testid="clients-grid">
                    {clients.map((client) => (
                      <ClientCard 
                        key={client.id} 
                        client={client} 
                        onClick={setSelectedClient} 
                        onEdit={(clientToEdit) => setClientToEdit(clientToEdit)}
                        onDelete={(id) => setClientToDelete(id)}
                        onTogglePin={handleTogglePinClient}
                      />
                    ))}
                  </div>

                  {/* Barra de Paginação */}
                  <div className="pagination-container">
                    <div className="pagination-info">
                      Mostrando <strong>{clients.length}</strong> de <strong>{total}</strong> contato(s)
                    </div>
                    <div className="pagination-controls">
                      <button 
                        type="button"
                        className="page-btn" 
                        disabled={page <= 1} 
                        onClick={(e) => { e.preventDefault(); setPage(prev => Math.max(prev - 1, 1)); }}
                        data-testid="prev-page-btn"
                      >
                        &larr; Anterior
                      </button>
                      <span className="page-number">Página {page} de {totalPages}</span>
                      <button 
                        type="button"
                        className="page-btn" 
                        disabled={page >= totalPages} 
                        onClick={(e) => { e.preventDefault(); setPage(prev => Math.min(prev + 1, totalPages)); }}
                        data-testid="next-page-btn"
                      >
                        Próxima &rarr;
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </main>

        {/* Modal de Edição */}
        <ClientEditModal 
          isOpen={!!clientToEdit}
          client={clientToEdit}
          onClose={() => setClientToEdit(null)}
          onSave={handleSaveEditClient}
          currentUser={currentUser}
        />

        {/* Modal de confirmação de exclusão */}
        {clientToDelete && (
          <div className="modal-backdrop" data-testid="delete-modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <h2 style={{ color: 'var(--badge-red-text)' }}>Confirmar Exclusão</h2>
              <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>
                Tem certeza que deseja apagar este contato e todas as suas senhas salvas permanentemente?
              </p>
              <div className="modal-actions">
                <button 
                  type="button"
                  className="btn btn-dark" 
                  onClick={() => setClientToDelete(null)}
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  className="btn btn-dark" 
                  onClick={confirmDeleteClient}
                  style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        <ClientFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleCreateClient} 
        />

        {inviteToken && (
          <InviteRegisterModal 
            token={inviteToken} 
            onClose={() => {
              setInviteToken(null);
              window.history.pushState({}, '', '/');
            }} 
            onRegisterSuccess={() => {
              setInviteToken(null);
              window.history.pushState({}, '', '/');
            }} 
          />
        )}
      </div>
    </ToastProvider>
  );
}
