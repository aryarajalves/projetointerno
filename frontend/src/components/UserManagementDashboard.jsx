import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';

export function UserManagementDashboard() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('userMgmtActiveTab') || 'users';
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('userMgmtActiveTab', tab);
  };
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');

  // Paginação
  const [userPage, setUserPage] = useState(1);
  const [userLimit, setUserLimit] = useState(20);
  const [invitePage, setInvitePage] = useState(1);
  const [inviteLimit, setInviteLimit] = useState(20);

  // Modal States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Edit & Reset Password States
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'USER', allowed_client_ids: [] });
  const [editClientSearch, setEditClientSearch] = useState('');
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Invite Form States
  const [inviteForm, setInviteForm] = useState({ valid_hours: 24, role: 'ADMIN', allowed_client_ids: [] });
  const [clientSearch, setClientSearch] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const openEditUserModal = (user) => {
    if (user.role === 'SUPER_ADMIN') return;
    setEditingUser(user);
    setEditClientSearch('');
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'USER',
      allowed_client_ids: user.allowed_clients ? user.allowed_clients.map(c => c.id) : []
    });
  };

  const toggleEditClientSelection = (clientId) => {
    setEditForm(prev => {
      const exists = prev.allowed_client_ids.includes(clientId);
      return {
        ...prev,
        allowed_client_ids: exists
          ? prev.allowed_client_ids.filter(id => id !== clientId)
          : [...prev.allowed_client_ids, clientId]
      };
    });
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`${API_URL}/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        setEditingUser(null);
        if (showToast) showToast('Informações do usuário atualizadas!', 'success');
        fetchUsers();
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Erro ao atualizar usuário.');
      }
    } catch (err) {
      alert('Erro de conexão ao atualizar usuário.');
    }
  };

  const openResetPasswordModal = (user) => {
    if (user.role === 'SUPER_ADMIN') return;
    setResetUser(user);
    setNewPassword('');
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetUser || !newPassword) return;

    try {
      const res = await fetch(`${API_URL}/api/users/${resetUser.id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword })
      });

      if (res.ok) {
        setResetUser(null);
        setNewPassword('');
        if (showToast) showToast('Senha redefinida com sucesso!', 'success');
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Erro ao resetar senha.');
      }
    } catch (err) {
      alert('Erro de conexão ao resetar senha.');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...(search && { search }),
        ...(roleFilter !== 'Todos' && { role: roleFilter })
      });
      const res = await fetch(`${API_URL}/api/users/?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/invites`);
      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      }
    } catch (err) {
      console.error("Erro ao carregar convites:", err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_URL}/api/clients/?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.items || []);
      }
    } catch (err) {
      console.error("Erro ao carregar clientes para o convite:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  useEffect(() => {
    fetchInvites();
    fetchClients();
  }, []);

  const handleOpenInviteModal = () => {
    setClientSearch('');
    setInviteForm({
      valid_hours: 24,
      role: 'ADMIN',
      allowed_client_ids: []
    });
    setIsInviteModalOpen(true);
  };

  const toggleClientSelection = (clientId) => {
    setInviteForm(prev => {
      const exists = prev.allowed_client_ids.includes(clientId);
      return {
        ...prev,
        allowed_client_ids: exists
          ? prev.allowed_client_ids.filter(id => id !== clientId)
          : [...prev.allowed_client_ids, clientId]
      };
    });
  };

  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/users/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm)
      });

      if (res.ok) {
        const data = await res.json();
        const fullLink = `${window.location.origin}/invite/${data.token}`;
        setGeneratedInviteLink(fullLink);
        setIsInviteModalOpen(false);
        setIsSuccessModalOpen(true);
        fetchInvites();
      } else {
        alert('Erro ao gerar link de convite.');
      }
    } catch (err) {
      alert('Erro de conexão ao gerar convite.');
    }
  };

  const copyInviteLink = (link) => {
    navigator.clipboard.writeText(link || generatedInviteLink);
    if (showToast) showToast('Link de convite copiado!', 'success');
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${userToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setUserToDelete(null);
        if (showToast) showToast('Usuário desativado.', 'success');
        fetchUsers();
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Erro ao desativar usuário.');
      }
    } catch (err) {
      alert('Erro ao desativar usuário.');
    }
  };

  // Paginação dos dados
  const totalUserPages = Math.ceil(users.length / userLimit) || 1;
  const startUserIndex = (userPage - 1) * userLimit;
  const paginatedUsers = users.slice(startUserIndex, startUserIndex + userLimit);

  const totalInvitePages = Math.ceil(invites.length / inviteLimit) || 1;
  const startInviteIndex = (invitePage - 1) * inviteLimit;
  const paginatedInvites = invites.slice(startInviteIndex, startInviteIndex + inviteLimit);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR');
  };

  return (
    <div data-testid="user-management-dashboard">
      {/* Header do Módulo de Gestão de Usuários */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff' }}>Gestão de Usuários</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Gerencie os acessos, cargos e convites dos operadores da plataforma.
          </p>
        </div>

        <button 
          type="button" 
          className="btn btn-emerald"
          onClick={handleOpenInviteModal}
          style={{ background: '#2563eb', borderColor: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}
          data-testid="new-user-invite-btn"
        >
          <span>👤+</span>
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Navegação por Abas */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button 
          type="button"
          onClick={() => handleTabChange('users')}
          style={{ 
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'users' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'users' ? '#2563eb' : 'var(--text-muted)',
            fontWeight: '800',
            fontSize: '1rem',
            padding: '0.75rem 0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>👥</span> Usuários Ativos ({users.length})
        </button>

        <button 
          type="button"
          onClick={() => handleTabChange('invites')}
          style={{ 
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'invites' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'invites' ? '#2563eb' : 'var(--text-muted)',
            fontWeight: '800',
            fontSize: '1rem',
            padding: '0.75rem 0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>🔗</span> Links de Convite ({invites.length})
        </button>
      </div>

      {/* Conteúdo da Aba 1: Usuários Ativos */}
      {activeTab === 'users' && (
        <>
          {/* Toolbar de Pesquisa e Filtros */}
          <div className="toolbar-card" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
            <div className="search-box" style={{ flex: 1 }}>
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setUserPage(1); }}
                data-testid="user-search-input"
              />
            </div>

            <div className="filter-item">
              <label htmlFor="userRoleSelect">Cargo:</label>
              <select 
                id="userRoleSelect"
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setUserPage(1); }}
                data-testid="user-role-filter"
              >
                <option value="Todos">Todos os Cargos</option>
                <option value="SUPER_ADMIN">🛡️ Super Admin</option>
                <option value="ADMIN">👤 Administrador</option>
                <option value="USER">👥 Usuário</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Carregando lista de usuários...</p>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-inner)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '1rem 1.25rem' }}>NOME / EMAIL</th>
                    <th style={{ padding: '1rem 1.25rem' }}>CARGO</th>
                    <th style={{ padding: '1rem 1.25rem' }}>STATUS</th>
                    <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.95rem' }}>
                            {u.name || 'Super Admin'}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {u.email}
                          </div>
                          {u.role === 'USER' && (
                            <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.3rem' }}>
                              🏢 Clientes: {u.allowed_clients && u.allowed_clients.length > 0 ? (
                                u.allowed_clients.map(c => c.name).join(', ')
                              ) : (
                                <span style={{ color: '#fca5a5' }}>Nenhum cliente associado</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span className="badge" style={{ 
                            background: u.role === 'SUPER_ADMIN' ? 'rgba(147, 51, 234, 0.2)' : u.role === 'ADMIN' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: u.role === 'SUPER_ADMIN' ? '#c084fc' : u.role === 'ADMIN' ? '#60a5fa' : 'var(--emerald-primary)',
                            border: `1px solid ${u.role === 'SUPER_ADMIN' ? '#c084fc' : u.role === 'ADMIN' ? '#60a5fa' : 'var(--emerald-primary)'}`,
                            fontSize: '0.7rem',
                            fontWeight: '800'
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{ color: 'var(--emerald-primary)', fontWeight: '700', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            ✓ ATIVO
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          {u.role === 'SUPER_ADMIN' ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              🔒 Protegido (Super Admin)
                            </span>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                              <button 
                                type="button"
                                onClick={() => openResetPasswordModal(u)}
                                style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#38bdf8' }}
                                title="Resetar Senha"
                              >
                                🔑 Resetar Senha
                              </button>
                              <button 
                                type="button"
                                onClick={() => openEditUserModal(u)}
                                style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#fff' }}
                                title="Editar Usuário"
                              >
                                ✏️ Editar
                              </button>
                              <button 
                                type="button"
                                onClick={() => setUserToDelete(u.id)}
                                style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#ef4444' }}
                                title="Excluir Usuário"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Paginação de Usuários Ativos (20, 50, 100, 200 por página) */}
              <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-card-inner)', borderTop: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Mostrando <strong style={{ color: '#fff' }}>{users.length > 0 ? startUserIndex + 1 : 0}</strong> até <strong style={{ color: '#fff' }}>{Math.min(users.length, startUserIndex + userLimit)}</strong> de <strong style={{ color: '#10b981' }}>{users.length}</strong> usuário(s)
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span>Exibir:</span>
                    <select 
                      value={userLimit} 
                      onChange={(e) => { setUserLimit(Number(e.target.value)); setUserPage(1); }}
                      data-testid="users-limit-select"
                      style={{ fontSize: '0.82rem', padding: '0.35rem 1.8rem 0.35rem 0.65rem' }}
                    >
                      <option value={20}>20 por página</option>
                      <option value={50}>50 por página</option>
                      <option value={100}>100 por página</option>
                      <option value={200}>200 por página</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-dark"
                      onClick={() => setUserPage(p => Math.max(1, p - 1))}
                      disabled={userPage <= 1}
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', opacity: userPage <= 1 ? 0.5 : 1 }}
                      data-testid="users-prev-page-btn"
                    >
                      &larr; Anterior
                    </button>

                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 0.25rem' }}>
                      {userPage} / {totalUserPages}
                    </span>

                    <button
                      type="button"
                      className="btn btn-dark"
                      onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                      disabled={userPage >= totalUserPages}
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', opacity: userPage >= totalUserPages ? 0.5 : 1 }}
                      data-testid="users-next-page-btn"
                    >
                      Próximo &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Conteúdo da Aba 2: Links de Convite */}
      {activeTab === 'invites' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-inner)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '1rem 1.25rem' }}>TOKEN DO CONVITE</th>
                <th style={{ padding: '1rem 1.25rem' }}>CARGO</th>
                <th style={{ padding: '1rem 1.25rem' }}>VALIDADE / EXPIRAÇÃO</th>
                <th style={{ padding: '1rem 1.25rem' }}>STATUS</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvites.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum link de convite gerado até o momento.
                  </td>
                </tr>
              ) : (
                paginatedInvites.map((inv) => {
                  const isExpired = new Date() > new Date(inv.expires_at);
                  const fullUrl = `${window.location.origin}/invite/${inv.token}`;

                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', color: '#fff', fontSize: '0.85rem' }}>
                        {inv.token.substring(0, 18)}...
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className="badge" style={{ background: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa', border: '1px solid #60a5fa', fontSize: '0.7rem', fontWeight: '800' }}>
                          {inv.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {formatDate(inv.expires_at)} ({inv.valid_hours}h)
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {inv.used ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ 
                              color: '#c084fc', 
                              fontWeight: '800', 
                              fontSize: '0.78rem', 
                              background: 'rgba(192, 132, 252, 0.15)',
                              border: '1px solid #c084fc',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              width: 'fit-content'
                            }}>
                              ✓ USUÁRIO CRIADO
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Convite já utilizado
                            </span>
                          </div>
                        ) : isExpired ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ 
                              color: '#ef4444', 
                              fontWeight: '800', 
                              fontSize: '0.78rem', 
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid #ef4444',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              width: 'fit-content'
                            }}>
                              ⏳ CONVITE EXPIRADO
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Prazo de validade esgotado
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ 
                              color: 'var(--emerald-primary)', 
                              fontWeight: '800', 
                              fontSize: '0.78rem', 
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid var(--emerald-primary)',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              width: 'fit-content'
                            }}>
                              ⚡ DISPONÍVEL (Aguardando Registro)
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Nenhum usuário se cadastrou ainda
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        {!inv.used && !isExpired && (
                          <button 
                            type="button"
                            className="btn btn-dark"
                            onClick={() => copyInviteLink(fullUrl)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            title="Copiar Link de Convite"
                          >
                            📋 Copiar Link
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Paginação de Links de Convite (20, 50, 100, 200 por página) */}
          <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-card-inner)', borderTop: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Mostrando <strong style={{ color: '#fff' }}>{invites.length > 0 ? startInviteIndex + 1 : 0}</strong> até <strong style={{ color: '#fff' }}>{Math.min(invites.length, startInviteIndex + inviteLimit)}</strong> de <strong style={{ color: '#38bdf8' }}>{invites.length}</strong> convite(s)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>Exibir:</span>
                <select 
                  value={inviteLimit} 
                  onChange={(e) => { setInviteLimit(Number(e.target.value)); setInvitePage(1); }}
                  data-testid="invites-limit-select"
                  style={{ fontSize: '0.82rem', padding: '0.35rem 1.8rem 0.35rem 0.65rem' }}
                >
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                  <option value={200}>200 por página</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() => setInvitePage(p => Math.max(1, p - 1))}
                  disabled={invitePage <= 1}
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', opacity: invitePage <= 1 ? 0.5 : 1 }}
                  data-testid="invites-prev-page-btn"
                >
                  &larr; Anterior
                </button>

                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 0.25rem' }}>
                  {invitePage} / {totalInvitePages}
                </span>

                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() => setInvitePage(p => Math.min(totalInvitePages, p + 1))}
                  disabled={invitePage >= totalInvitePages}
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', opacity: invitePage >= totalInvitePages ? 0.5 : 1 }}
                  data-testid="invites-next-page-btn"
                >
                  Próximo &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Configurar Convite */}
      {isInviteModalOpen && (
        <div className="modal-backdrop" data-testid="invite-form-modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <span>👤+</span> Convidar Novo Usuário
              </h2>
              <button 
                type="button" 
                onClick={() => setIsInviteModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateInvite}>
              <div className="form-group">
                <label>PRAZO DE VALIDADE DO CONVITE *</label>
                <select 
                  value={inviteForm.valid_hours}
                  onChange={(e) => setInviteForm({ ...inviteForm, valid_hours: Number(e.target.value) })}
                >
                  <option value={24}>24 Horas</option>
                  <option value={48}>48 Horas</option>
                  <option value={72}>72 Horas</option>
                  <option value={168}>7 Dias</option>
                </select>
              </div>

              <div className="form-group">
                <label>NÍVEL DE ACESSO (CARGO) *</label>
                <select 
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                >
                  <option value="ADMIN">Administrador (Configurações Totais)</option>
                  <option value="USER">Usuário (Restrito a Clientes Selecionados)</option>
                </select>
              </div>

              {/* Acesso aos Clientes */}
              {inviteForm.role === 'USER' && (
                <div className="form-group" style={{ background: 'var(--bg-card-inner)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#fff', textTransform: 'uppercase', margin: 0 }}>
                      ACESSO AOS CLIENTES
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {inviteForm.allowed_client_ids.length} selecionado(s)
                    </span>
                  </div>

                  {/* Campo de Busca Rápida por Nome do Cliente */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <input 
                      type="text"
                      placeholder="🔍 Filtrar por nome do cliente..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', width: '100%', background: 'var(--bg-dark)' }}
                      data-testid="invite-client-search-input"
                    />
                  </div>
                  
                  {clients.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhum cliente cadastrado.</p>
                  ) : (
                    <div style={{ maxHeight: '170px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {clients
                        .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                        .map((c) => (
                          <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#fff', cursor: 'pointer', background: 'var(--bg-dark)', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <input 
                              type="checkbox"
                              checked={inviteForm.allowed_client_ids.includes(c.id)}
                              onChange={() => toggleClientSelection(c.id)}
                              style={{ accentColor: '#2563eb', cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                            <span style={{ fontWeight: '600' }}>{c.name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{c.type}</span>
                          </label>
                        ))}
                      {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>
                          Nenhum cliente encontrado para "{clientSearch}".
                        </p>
                      )}
                    </div>
                  )}
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.6rem', fontStyle: 'italic', margin: '0.6rem 0 0 0' }}>
                    O usuário terá acesso e permissão para gerenciar apenas os clientes marcados acima.
                  </p>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-dark" onClick={() => setIsInviteModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-emerald" style={{ background: '#2563eb', borderColor: '#2563eb' }}>
                  Gerar Link de Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Convite Pronto */}
      {isSuccessModalOpen && (
        <div className="modal-backdrop" data-testid="invite-success-modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setIsSuccessModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid var(--emerald-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justify: 'center',
              fontSize: '1.6rem',
              color: 'var(--emerald-primary)',
              marginBottom: '1rem'
            }}>
              ✓
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff', marginBottom: '0.5rem' }}>
              Convite Pronto!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Copie o link abaixo e envie para o novo usuário se cadastrar.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-dark)', padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <input 
                type="text" 
                readOnly
                value={generatedInviteLink}
                style={{ flex: 1, border: 'none', background: 'transparent', color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace' }}
              />
              <button 
                type="button"
                className="btn btn-dark"
                onClick={() => copyInviteLink(generatedInviteLink)}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                title="Copiar link"
              >
                📋
              </button>
            </div>

            <button 
              type="button"
              className="btn btn-emerald"
              onClick={() => setIsSuccessModalOpen(false)}
              style={{ width: '100%', background: '#2563eb', borderColor: '#2563eb', padding: '0.75rem' }}
            >
              Concluir
            </button>
          </div>
        </div>
      )}

      {/* Modal de Editar Usuário */}
      {editingUser && (
        <div className="modal-backdrop" data-testid="edit-user-modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>✏️ Editar Usuário</h2>
              <button type="button" onClick={() => setEditingUser(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveUserEdit}>
              <div className="form-group">
                <label>NOME COMPLETO *</label>
                <input 
                  type="text" 
                  required 
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>ENDEREÇO DE E-MAIL *</label>
                <input 
                  type="email" 
                  required 
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>NÍVEL DE ACESSO (CARGO) *</label>
                <select 
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="ADMIN">Administrador (Configurações Totais)</option>
                  <option value="USER">Usuário (Restrito a Clientes Autorizados)</option>
                </select>
              </div>

              {/* SEÇÃO DE CLIENTES PERMITIDOS SE FOR USER */}
              {editForm.role === 'USER' && (
                <div className="form-group" style={{ background: 'var(--bg-card-inner)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#fff', textTransform: 'uppercase', margin: 0 }}>
                      CLIENTES PERMITIDOS
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {editForm.allowed_client_ids.length} selecionado(s)
                    </span>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <input 
                      type="text"
                      placeholder="🔍 Filtrar por nome do cliente..."
                      value={editClientSearch}
                      onChange={(e) => setEditClientSearch(e.target.value)}
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', width: '100%', background: 'var(--bg-dark)' }}
                      data-testid="edit-user-client-search-input"
                    />
                  </div>
                  
                  {clients.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhum cliente cadastrado.</p>
                  ) : (
                    <div style={{ maxHeight: '170px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {clients
                        .filter(c => c.name.toLowerCase().includes(editClientSearch.toLowerCase()))
                        .map((c) => (
                          <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#fff', cursor: 'pointer', background: 'var(--bg-dark)', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <input 
                              type="checkbox"
                              checked={editForm.allowed_client_ids.includes(c.id)}
                              onChange={() => toggleEditClientSelection(c.id)}
                              style={{ accentColor: 'var(--emerald-primary)', cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                            <span style={{ fontWeight: '600' }}>{c.name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{c.type}</span>
                          </label>
                        ))}
                      {clients.filter(c => c.name.toLowerCase().includes(editClientSearch.toLowerCase())).length === 0 && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>
                          Nenhum cliente encontrado para "{editClientSearch}".
                        </p>
                      )}
                    </div>
                  )}
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.6rem', fontStyle: 'italic', margin: '0.6rem 0 0 0' }}>
                    O usuário terá permissão para visualizar apenas os clientes marcados acima.
                  </p>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-dark" onClick={() => setEditingUser(null)}>Cancelar</button>
                <button type="submit" className="btn btn-emerald">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Resetar Senha */}
      {resetUser && (
        <div className="modal-backdrop" data-testid="reset-password-modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#38bdf8', margin: 0 }}>🔑 Resetar Senha do Usuário</h2>
              <button type="button" onClick={() => setResetUser(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Digite a nova senha para o usuário <strong style={{ color: '#fff' }}>{resetUser.name || resetUser.email}</strong>.
            </p>

            <form onSubmit={handleResetPasswordSubmit}>
              <div className="form-group">
                <label>NOVA SENHA *</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ background: 'var(--bg-dark)', color: '#fff' }}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-dark" onClick={() => setResetUser(null)}>Cancelar</button>
                <button type="submit" className="btn btn-emerald" style={{ background: '#38bdf8', borderColor: '#38bdf8' }}>
                  Redefinir Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Desativação */}
      {userToDelete && (
        <div className="modal-backdrop" data-testid="delete-user-modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ color: 'var(--badge-red-text)', marginBottom: '0.75rem' }}>Confirmar Remoção</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Deseja remover o acesso deste usuário ao sistema?
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-dark" onClick={() => setUserToDelete(null)}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-dark" 
                onClick={confirmDeleteUser}
                style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
