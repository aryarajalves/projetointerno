import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';

export function StackUpdateDashboard({ currentUser }) {
  const { showToast } = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [targetApp, setTargetApp] = useState('agentflow');
  const [newImage, setNewImage] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [portainerFilter, setPortainerFilter] = useState('all'); // 'all', 'configured', 'unconfigured'
  const [searchQuery, setSearchQuery] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const appOptions = [
    { key: 'agentflow', name: 'AgentFlow', icon: '🤖' },
    { key: 'zapjords', name: 'ZapJords', icon: '⚡' },
    { key: 'oraculo', name: 'Oráculo', icon: '🔮' },
    { key: 'zapgroup', name: 'ZapGroup', icon: '👥' }
  ];

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const url = `${API_URL}/api/clients/?contact_type=Cliente&limit=1000${currentUser?.id ? `&user_id=${currentUser.id}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setClients(data.items || []);
      }
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      if (showToast) showToast('Erro ao carregar lista de clientes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getClientStackForApp = (client, appKey) => {
    if (appKey === 'zapjords') return client.zapjords_stack_name;
    if (appKey === 'oraculo') return client.oraculo_stack_name;
    if (appKey === 'zapgroup') return client.zapgroup_stack_name;
    if (appKey === 'agentflow') return client.agentflow_stack_name;
    return client.agentflow_stack_name || client.portainer_stack_name;
  };

  const isClientConfigured = (client) => {
    // Cliente deve ter Portainer (URL, User, Pwd)
    return !!(client.portainer_url && client.portainer_username && client.portainer_password);
  };

  const clientList = clients.filter(c => (c.type || 'Cliente').toLowerCase() === 'cliente');
  const configuredClients = clientList.filter(isClientConfigured);
  const unconfiguredClients = clientList.filter(c => !isClientConfigured(c));

  const filteredClients = clientList.filter(c => {
    const isConf = isClientConfigured(c);
    if (portainerFilter === 'configured' && !isConf) return false;
    if (portainerFilter === 'unconfigured' && isConf) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      if (!c.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleToggleSelectAll = () => {
    const targetConfiguredInFiltered = filteredClients.filter(isClientConfigured);
    const targetIds = targetConfiguredInFiltered.map(c => c.id);

    const allSelected = targetIds.every(id => selectedClientIds.includes(id));

    if (allSelected && targetIds.length > 0) {
      setSelectedClientIds(prev => prev.filter(id => !targetIds.includes(id)));
    } else {
      setSelectedClientIds(prev => Array.from(new Set([...prev, ...targetIds])));
    }
  };

  const handleToggleClient = (id) => {
    setSelectedClientIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExecuteUpdate = async (e) => {
    e.preventDefault();
    if (!newImage.trim()) {
      if (showToast) showToast('Informe a tag da nova imagem Docker.', 'error');
      return;
    }
    if (selectedClientIds.length === 0) {
      if (showToast) showToast('Selecione pelo menos um cliente com stack configurada.', 'error');
      return;
    }

    try {
      setIsExecuting(true);
      setResults(null);
      const res = await fetch(`${API_URL}/api/stack-update/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Role': currentUser?.role || ''
        },
        body: JSON.stringify({
          client_ids: selectedClientIds,
          new_image: newImage.trim(),
          target_app: targetApp
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
        const successes = data.filter(r => r.status === 'success').length;
        const errors = data.filter(r => r.status === 'error').length;
        if (showToast) {
          showToast(`Atualização finalizada: ${successes} sucesso(s), ${errors} erro(s).`, successes > 0 ? 'success' : 'error');
        }
      } else {
        const errData = await res.json();
        if (showToast) showToast(errData.detail || 'Erro ao disparar atualização de stacks.', 'error');
      }
    } catch (err) {
      console.error('Erro ao executar atualização:', err);
      if (showToast) showToast('Erro de conexão com o servidor.', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '2rem' }}>🚀</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            Atualizar Stacks dos Servidores
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
          Escolha a aplicação, selecione os servidores dos clientes e execute o deploy em lote via Portainer API.
        </p>
      </div>

      {/* Seletor de Aplicação */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
          1. SELECIONE A APLICAÇÃO A SER ATUALIZADA
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {appOptions.map(app => {
            const isSelected = targetApp === app.key;
            return (
              <button
                key={app.key}
                type="button"
                onClick={() => {
                  setTargetApp(app.key);
                  setSelectedClientIds([]);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1.1rem',
                  borderRadius: '12px',
                  background: isSelected ? 'rgba(59, 130, 246, 0.18)' : 'var(--bg-card-inner)',
                  border: `2px solid ${isSelected ? '#3b82f6' : 'var(--border-color)'}`,
                  color: isSelected ? '#3b82f6' : '#fff',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{app.icon}</span>
                <span>{app.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        {/* Coluna Esquerda: Lista de Servidores/Clientes */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                Servidores dos Clientes ({filteredClients.length})
              </h3>
              <button
                type="button"
                className="btn btn-dark"
                onClick={handleToggleSelectAll}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                disabled={configuredClients.length === 0}
              >
                {selectedClientIds.length > 0 && selectedClientIds.length === filteredClients.filter(isClientConfigured).length
                  ? 'Desmarcar Todos'
                  : 'Selecionar Configurados'}
              </button>
            </div>

            {/* BARRA DE FILTROS: PESQUISA + FILTRO PORTAINER STATUS */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <input
                  type="text"
                  placeholder="🔍 Pesquisar por nome do cliente..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                  data-testid="search-client-stack-input"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  PORTAINER:
                </label>
                <select
                  value={portainerFilter}
                  onChange={(e) => {
                    setPortainerFilter(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  data-testid="portainer-status-filter-select"
                >
                  <option value="all">🌐 Todos ({clientList.length})</option>
                  <option value="configured">✅ Com Portainer OK ({configuredClients.length})</option>
                  <option value="unconfigured">⚠️ Sem Portainer ({unconfiguredClients.length})</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Carregando servidores...
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Nenhum cliente encontrado com os filtros selecionados.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '380px' }}>
                {filteredClients.slice((page - 1) * limit, page * limit).map(c => {
                  const stackName = getClientStackForApp(c, targetApp);
                  const isConfigured = isClientConfigured(c);
                  const isSelected = selectedClientIds.includes(c.id);

                  return (
                    <div
                      key={c.id}
                      onClick={() => isConfigured && handleToggleClient(c.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card-inner)',
                        border: `1px solid ${isSelected ? '#3b82f6' : 'var(--border-color)'}`,
                        cursor: isConfigured ? 'pointer' : 'not-allowed',
                        opacity: isConfigured ? 1 : 0.6,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isConfigured}
                          onChange={() => {}}
                          style={{ accentColor: '#3b82f6', width: '16px', height: '16px', cursor: isConfigured ? 'pointer' : 'not-allowed' }}
                        />
                        <div>
                          <div style={{ fontWeight: '800', color: '#fff', fontSize: '0.92rem' }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            🌐 {c.server_ip || 'Sem IP'} &bull; Stack {targetApp.toUpperCase()}: <strong style={{ color: stackName ? '#38bdf8' : '#eab308' }}>{stackName || 'Padrão'}</strong>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isConfigured ? (
                          <span style={{ fontSize: '0.72rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', padding: '0.2rem 0.5rem', fontWeight: '700' }}>
                            ✅ Portainer OK
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', background: 'rgba(234,179,8,0.12)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '6px', padding: '0.2rem 0.5rem', fontWeight: '700' }}>
                            ⚠️ Sem Portainer
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Controle de Paginação de Servidores */}
              {(() => {
                const totalPages = Math.ceil(filteredClients.length / limit) || 1;
                const startIndex = (page - 1) * limit;
                return (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Mostrando <strong style={{ color: '#fff' }}>{filteredClients.length > 0 ? startIndex + 1 : 0}</strong> até <strong style={{ color: '#fff' }}>{Math.min(filteredClients.length, startIndex + limit)}</strong> de <strong style={{ color: '#3b82f6' }}>{filteredClients.length}</strong> servidor(es)
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <span>Exibir:</span>
                        <select 
                          value={limit} 
                          onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                          data-testid="servers-limit-select"
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
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page <= 1}
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', opacity: page <= 1 ? 0.5 : 1 }}
                          data-testid="servers-prev-page-btn"
                        >
                          &larr; Anterior
                        </button>

                        <span style={{ fontSize: '0.82rem', color: '#fff', padding: '0 0.4rem', fontWeight: '700' }}>
                          {page} / {totalPages}
                        </span>

                        <button
                          type="button"
                          className="btn btn-dark"
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages}
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', opacity: page >= totalPages ? 0.5 : 1 }}
                          data-testid="servers-next-page-btn"
                        >
                          Próxima &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>

        {/* Coluna Direita: Formulário de Execução */}
        <div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', position: 'sticky', top: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              ⚙️ Executar Deploy ({targetApp.toUpperCase()})
            </h3>

            <form onSubmit={handleExecuteUpdate}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff' }}>
                  NOVA IMAGEM DOCKER *
                </label>
                <input
                  type="text"
                  placeholder="ex: ghcr.io/org/app:v1.2.3"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem' }}
                  data-testid="new-image-input"
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                  A imagem será aplicada nas stacks da aplicação {targetApp.toUpperCase()} dos servidores selecionados.
                </span>
              </div>

              <div style={{ background: 'var(--bg-card-inner)', padding: '0.85rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SELECIONADOS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#3b82f6', marginTop: '0.2rem' }}>
                  {selectedClientIds.length} servidor(es)
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-emerald"
                disabled={isExecuting || selectedClientIds.length === 0}
                style={{ width: '100%', padding: '0.85rem', fontWeight: '800', background: '#3b82f6', borderColor: '#3b82f6' }}
                data-testid="execute-update-btn"
              >
                {isExecuting ? '🚀 Atualizando...' : `🚀 Atualizar ${targetApp.toUpperCase()}`}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Resultados da Execução */}
      {results && (
        <div style={{ marginTop: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            📊 Resultado da Atualização ({targetApp.toUpperCase()})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {results.map(r => (
              <div
                key={r.client_id}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: r.status === 'success' ? 'rgba(16,185,129,0.08)' : r.status === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${r.status === 'success' ? '#10b981' : r.status === 'error' ? '#ef4444' : 'var(--border-color)'}`,
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{r.client_name}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {r.message}
                  </div>
                </div>
                <div>
                  {r.status === 'success' && (
                    <span style={{ color: '#10b981', fontWeight: '800', fontSize: '0.85rem' }}>
                      ✅ Sucesso
                    </span>
                  )}
                  {r.status === 'error' && (
                    <span style={{ color: '#ef4444', fontWeight: '800', fontSize: '0.85rem' }}>
                      ❌ Falha
                    </span>
                  )}
                  {r.status === 'skipped' && (
                    <span style={{ color: '#eab308', fontWeight: '800', fontSize: '0.85rem' }}>
                      ⚠️ Ignorado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
