import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';

export function CredentialsManager({ clientId, clientName, currentUser }) {
  const { showToast } = useToast();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCred, setEditingCred] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [credToDelete, setCredToDelete] = useState(null);

  // Pagination & Search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    access_url: '',
    username: '',
    password: '',
    notes: '',
    is_superadmin_only: false
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });

      const headers = {};
      if (currentUser?.role) {
        headers['X-User-Role'] = currentUser.role;
      }

      const res = await fetch(`${API_URL}/api/clients/${clientId}/credentials?${queryParams.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCredentials(data.items);
        setTotal(data.total);
        setTotalPages(data.pages);
      }
    } catch (err) {
      console.error("Erro ao carregar credenciais:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) fetchCredentials();
  }, [clientId, page, limit, search, currentUser?.role]);

  const openCreateModal = () => {
    setEditingCred(null);
    setFormData({ title: '', access_url: '', username: '', password: '', notes: '', is_superadmin_only: false });
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (cred) => {
    setEditingCred(cred);
    setFormData({
      title: cred.title,
      access_url: cred.access_url || '',
      username: cred.username,
      password: cred.password,
      notes: cred.notes || '',
      is_superadmin_only: !!cred.is_superadmin_only
    });
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const handleSaveCredential = async (e) => {
    e.preventDefault();
    const isEdit = !!editingCred;
    const url = isEdit 
      ? `${API_URL}/api/clients/${clientId}/credentials/${editingCred.id}`
      : `${API_URL}/api/clients/${clientId}/credentials`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingCred(null);
        setFormData({ title: '', access_url: '', username: '', password: '', notes: '' });
        fetchCredentials();
      } else {
        alert('Erro ao salvar credencial.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar credencial.');
    }
  };

  const confirmDeleteCredential = async () => {
    if (!credToDelete) return;

    try {
      const res = await fetch(`${API_URL}/api/clients/${clientId}/credentials/${credToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCredToDelete(null);
        fetchCredentials();
      }
    } catch (err) {
      alert('Erro ao deletar credencial.');
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    if (showToast) {
      showToast(`${label} copiado para a área de transferência!`, 'success');
    }
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔑 Gerenciador de Senhas & Acessos
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Armazene, consulte e edite os links, logins e senhas das ferramentas do contato <strong style={{ color: '#fff' }}>{clientName || ''}</strong>.
          </p>
        </div>
        <button 
          type="button"
          className="btn btn-emerald" 
          onClick={openCreateModal}
          data-testid="add-credential-btn"
        >
          + NOVA CREDENCIAL
        </button>
      </div>

      {/* Toolbar com Busca de Senhas e Seleção de Itens por Página */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="search-box" style={{ flex: 1, minWidth: '220px' }}>
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Pesquisar por aplicação, usuário ou URL..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            data-testid="cred-search-input"
          />
        </div>

        <div className="filter-item">
          <label htmlFor="credLimitSelect">Exibir:</label>
          <select 
            id="credLimitSelect"
            value={limit} 
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            data-testid="cred-limit-select"
          >
            <option value={10}>10 por página</option>
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Carregando senhas salvas...</p>
      ) : credentials.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--bg-card-inner)', borderRadius: '12px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.25rem' }}>Nenhuma senha encontrada</p>
          <p style={{ fontSize: '0.85rem' }}>{search ? 'Tente alterar a pesquisa.' : 'Clique em "+ NOVA CREDENCIAL" para salvar dados de acesso.'}</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', minHeight: '320px', alignContent: 'start' }}>
            {credentials.map((cred) => (
              <div key={cred.id} style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span>💻 {cred.title}</span>
                    {cred.is_superadmin_only && (
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', width: 'fit-content', fontWeight: '600' }} data-testid={`superadmin-badge-${cred.id}`}>
                        🔒 Apenas Super Admin
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button 
                      type="button"
                      onClick={() => openEditModal(cred)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.7 }}
                      title="Editar credencial"
                      data-testid={`edit-cred-btn-${cred.id}`}
                    >
                      ✏️
                    </button>
                    <button 
                      type="button"
                      onClick={() => setCredToDelete(cred.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.7 }}
                      title="Excluir credencial"
                      data-testid={`delete-cred-btn-${cred.id}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {cred.access_url && (
                  <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>LINK DE ACESSO</span>
                    <a 
                      href={cred.access_url.startsWith('http') ? cred.access_url : `https://${cred.access_url}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      🔗 {cred.access_url}
                    </a>
                  </div>
                )}

                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>E-MAIL / USUÁRIO</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace' }}>{cred.username}</span>
                    <button 
                      type="button"
                      onClick={() => copyToClipboard(cred.username, 'E-mail')}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                      title="Copiar e-mail"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>SENHA</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ color: 'var(--emerald-primary)', fontSize: '0.95rem', fontFamily: 'monospace', fontWeight: '700' }}>
                      {visiblePasswords[cred.id] ? cred.password : '••••••••••••'}
                    </span>
                    <button 
                      type="button"
                      onClick={() => togglePasswordVisibility(cred.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                      title={visiblePasswords[cred.id] ? "Ocultar senha" : "Ver senha"}
                    >
                      {visiblePasswords[cred.id] ? '🙈' : '👁️'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => copyToClipboard(cred.password, 'Senha')}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                      title="Copiar senha"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controle de Paginação de Senhas sem Salto de Tela */}
          <div className="pagination-container" style={{ marginTop: '1.5rem' }}>
            <div className="pagination-info">
              Mostrando <strong>{credentials.length}</strong> de <strong>{total}</strong> credencial(is)
            </div>
            <div className="pagination-controls">
              <button 
                type="button"
                className="page-btn" 
                disabled={page <= 1} 
                onClick={(e) => { e.preventDefault(); setPage(prev => Math.max(prev - 1, 1)); }}
                data-testid="cred-prev-page-btn"
              >
                &larr; Anterior
              </button>
              <span className="page-number">Página {page} de {totalPages}</span>
              <button 
                type="button"
                className="page-btn" 
                disabled={page >= totalPages} 
                onClick={(e) => { e.preventDefault(); setPage(prev => Math.min(prev + 1, totalPages)); }}
                data-testid="cred-next-page-btn"
              >
                Próxima &rarr;
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal de Confirmação de Exclusão de Credencial */}
      {credToDelete && (
        <div className="modal-backdrop" data-testid="delete-cred-modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <h2 style={{ color: 'var(--badge-red-text)', marginBottom: '0.75rem' }}>Confirmar Exclusão</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Deseja realmente remover esta credencial de acesso permanentemente?
            </p>
            <div className="modal-actions">
              <button 
                type="button"
                className="btn btn-dark" 
                onClick={() => setCredToDelete(null)}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="btn btn-dark" 
                onClick={confirmDeleteCredential}
                style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para criar ou editar credencial */}
      {isModalOpen && (
        <div className="modal-backdrop" data-testid="cred-form-modal-backdrop">
          <div className="modal-content">
            <h2>{editingCred ? 'Editar Credencial de Acesso' : 'Cadastrar Nova Credencial de Acesso'}</h2>
            <form onSubmit={handleSaveCredential}>
              <div className="form-group">
                <label>NOME DO APLICATIVO / FERRAMENTA *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: ZapVoice, Hotmart, Instagram..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>LINK DE ACESSO (URL)</label>
                <input 
                  type="text" 
                  placeholder="https://app.zapvoice.com"
                  value={formData.access_url}
                  onChange={(e) => setFormData({ ...formData, access_url: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>E-MAIL / USUÁRIO *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="usuario@empresa.com"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>SENHA DE ACESSO *</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showFormPassword ? 'text' : 'password'} 
                    required 
                    placeholder="SuaSenhaSegura123"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    style={{ 
                      position: 'absolute', 
                      right: '0.75rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      background: 'transparent', 
                      border: 'none', 
                      cursor: 'pointer',
                      fontSize: '1rem',
                      opacity: 0.8
                    }}
                    title={showFormPassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showFormPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justify: 'space-between', 
                padding: '0.85rem 1rem', 
                background: 'var(--bg-card-inner)', 
                borderRadius: '10px', 
                border: '1px solid var(--border-color)', 
                marginBottom: '1.25rem',
                marginTop: '0.5rem'
              }}>
                <div>
                  <label style={{ margin: 0, cursor: 'pointer', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    🛡️ Visível apenas para Super Admin
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    Se ativado, apenas o Super Admin poderá visualizar esta credencial.
                  </span>
                </div>
                <input 
                  type="checkbox" 
                  id="is_superadmin_only_toggle"
                  checked={!!formData.is_superadmin_only} 
                  onChange={(e) => setFormData({ ...formData, is_superadmin_only: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--emerald-primary)' }}
                  data-testid="cred-superadmin-only-toggle"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-dark" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-emerald">
                  {editingCred ? 'Salvar Alterações' : 'Salvar Credencial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
