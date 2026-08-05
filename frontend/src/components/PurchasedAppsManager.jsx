import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';
import { PurchasedAppModal } from './purchased_apps/PurchasedAppModal';
import { InstallmentScheduleModal } from './purchased_apps/InstallmentScheduleModal';

const ALL_APPS = [
  { name: 'AgentFlow', icon: '🤖', description: 'Automação de Fluxos & IA Agents' },
  { name: 'ZapJords', icon: '⚡', description: 'Plataforma de Automação de WhatsApp' },
  { name: 'Oraculo', icon: '🔮', description: 'Inteligência de Dados & Respostas' },
  { name: 'ZapGroup', icon: '👥', description: 'Gestão de Grupos e Disparos' }
];

export function PurchasedAppsManager({ clientId, clientName }) {
  const toastCtx = useToast();
  const showToast = toastCtx?.showToast;

  const [purchasedApps, setPurchasedApps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [modalAppName, setModalAppName] = useState('AgentFlow');
  const [appToDelete, setAppToDelete] = useState(null);
  const [viewInstallmentsApp, setViewInstallmentsApp] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchPurchasedApps = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/clients/${clientId}/apps`);
      if (res.ok) {
        const data = await res.json();
        setPurchasedApps(data);
      }
    } catch (err) {
      console.error("Erro ao carregar aplicações:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) fetchPurchasedApps();
  }, [clientId]);

  const totalPriceSum = purchasedApps.reduce((acc, app) => acc + (app.price || 0), 0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Não definida';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const openRegisterModal = (appName = 'AgentFlow', existingApp = null) => {
    setModalAppName(appName);
    setEditingApp(existingApp);
    setIsModalOpen(true);
  };

  const handleSaveApp = async (payload) => {
    try {
      const res = await fetch(`${API_URL}/api/clients/${clientId}/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        if (showToast) showToast(`Aplicação ${payload.app_name} salva com sucesso!`, 'success');
        fetchPurchasedApps();
      } else {
        alert('Erro ao salvar aplicação.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar aplicação.');
    }
  };

  const confirmDeleteApp = async () => {
    if (!appToDelete) return;

    try {
      const res = await fetch(`${API_URL}/api/clients/${clientId}/apps/${appToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAppToDelete(null);
        if (showToast) showToast('Aplicação removida do cadastro.', 'success');
        fetchPurchasedApps();
      }
    } catch (err) {
      alert('Erro ao remover aplicação.');
    }
  };

  const handleToggleInstallmentStatus = async (appId, installmentId, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    try {
      const res = await fetch(`${API_URL}/api/clients/${clientId}/apps/${appId}/installments/${installmentId}?status=${newStatus}`, {
        method: 'PATCH'
      });
      if (res.ok) {
        if (showToast) showToast('Status da parcela atualizado!', 'success');
        fetchPurchasedApps();
        if (viewInstallmentsApp && viewInstallmentsApp.id === appId) {
          setViewInstallmentsApp(prev => ({
            ...prev,
            installments: prev.installments.map(inst => 
              inst.id === installmentId ? { ...inst, status: newStatus } : inst
            )
          }));
        }
      }
    } catch (err) {
      alert('Erro ao atualizar parcela.');
    }
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* Header do Módulo & Resumo Financeiro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📦 Aplicações Contratadas
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Registre e consulte quais ferramentas o cliente <strong style={{ color: '#fff' }}>{clientName || ''}</strong> comprou, parcelas e datas de renovação.
          </p>
        </div>
        <button 
          type="button"
          className="btn btn-emerald" 
          onClick={() => openRegisterModal()}
          data-testid="add-purchased-app-btn"
        >
          + REGISTRAR COMPRA
        </button>
      </div>

      {/* Card do Valor Total Pago ao Todo */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)', 
        border: '1px solid var(--emerald-primary)', 
        borderRadius: '14px', 
        padding: '1.5rem', 
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              VALOR TOTAL INVESTIDO (AO TODO)
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-card-inner)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              Ferramentas Compradas: <strong style={{ color: '#fff' }}>{purchasedApps.length} de 4</strong>
            </span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--emerald-primary)', marginTop: '0.3rem' }}>
            {formatCurrency(totalPriceSum)}
          </div>
        </div>
      </div>

      {/* Grid das 4 Ferramentas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {ALL_APPS.map((app) => {
          const purchased = purchasedApps.find(p => p.app_name.toLowerCase() === app.name.toLowerCase());
          const paidInstallments = purchased?.installments ? purchased.installments.filter(i => i.status === 'paid').length : 0;
          const totalInst = purchased?.installments ? purchased.installments.length : 0;

          return (
            <div 
              key={app.name} 
              style={{ 
                background: 'var(--bg-card-inner)', 
                border: purchased ? '1px solid var(--emerald-primary)' : '1px solid var(--border-color)', 
                borderRadius: '14px', 
                padding: '1.25rem',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                opacity: purchased ? 1 : 0.65
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>{app.icon}</span>
                    <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#fff' }}>{app.name}</span>
                  </div>
                  <span className={`badge ${purchased ? 'badge-cliente' : 'badge-inativo'}`}>
                    {purchased ? '✓ Adquirido' : 'Não Comprado'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {app.description}
                </p>

                {/* Badge de Forma de Pagamento & Renovação */}
                {purchased && (
                  <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div>
                      {purchased.payment_status === 'installment' ? (
                        <div 
                          onClick={() => setViewInstallmentsApp(purchased)}
                          style={{ 
                            cursor: 'pointer',
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.4rem',
                            background: 'rgba(234, 179, 8, 0.15)', 
                            border: '1px solid #eab308', 
                            color: '#fef08a',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '700'
                          }}
                          data-testid={`view-installments-btn-${app.name}`}
                        >
                          <span>⏳ Parcelado ({paidInstallments}/{totalInst} pagas)</span>
                          <span style={{ fontSize: '0.7rem' }}>🔍</span>
                        </div>
                      ) : purchased.payment_status === 'pending' ? (
                        <div 
                          onClick={() => setViewInstallmentsApp(purchased)}
                          style={{ 
                            cursor: 'pointer',
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.4rem',
                            background: 'rgba(234, 179, 8, 0.15)', 
                            border: '1px solid #eab308', 
                            color: '#fef08a',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '700'
                          }}
                          data-testid={`view-installments-btn-${app.name}`}
                        >
                          <span>⏳ À Vista (Pendente - Pagamento: {purchased.installments?.[0]?.due_date ? formatDate(purchased.installments[0].due_date) : 'A definir'})</span>
                          <span style={{ fontSize: '0.7rem' }}>🔍</span>
                        </div>
                      ) : (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.3rem',
                          background: 'rgba(16, 185, 129, 0.15)', 
                          border: '1px solid var(--emerald-primary)', 
                          color: 'var(--emerald-primary)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '700'
                        }}>
                          ✓ Pago à Vista
                        </span>
                      )}
                    </div>

                    {purchased.renewal_date && (
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '600' }}>
                        🔄 Renovação: <strong>{formatDate(purchased.renewal_date)}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>VALOR TOTAL</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: purchased ? 'var(--emerald-primary)' : 'var(--text-sub)' }}>
                      {purchased ? formatCurrency(purchased.price) : 'R$ 0,00'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {purchased ? (
                      <>
                        <button 
                          type="button"
                          className="btn btn-dark" 
                          onClick={() => openRegisterModal(app.name, purchased)}
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                          title="Editar compra, parcelas e renovação"
                          data-testid={`edit-app-btn-${app.name}`}
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          type="button"
                          onClick={() => setAppToDelete(purchased.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.7 }}
                          title="Remover compra"
                        >
                          🗑️
                        </button>
                      </>
                    ) : (
                      <button 
                        type="button"
                        className="btn btn-emerald" 
                        onClick={() => openRegisterModal(app.name, null)}
                        style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        + Registrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Cronograma de Parcelas */}
      <InstallmentScheduleModal 
        app={viewInstallmentsApp}
        onClose={() => setViewInstallmentsApp(null)}
        onToggleStatus={handleToggleInstallmentStatus}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />

      {/* Modal de Formulário (Cadastro / Edição) */}
      <PurchasedAppModal 
        isOpen={isModalOpen}
        initialApp={editingApp}
        initialAppName={modalAppName}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveApp}
      />

      {/* Modal de Confirmação de Remoção de Compra */}
      {appToDelete && (
        <div className="modal-backdrop" data-testid="delete-app-modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <h2 style={{ color: 'var(--badge-red-text)', marginBottom: '0.75rem' }}>Confirmar Remoção</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Deseja remover o registro de compra desta aplicação e suas parcelas?
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-dark" onClick={() => setAppToDelete(null)}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-dark" 
                onClick={confirmDeleteApp}
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
