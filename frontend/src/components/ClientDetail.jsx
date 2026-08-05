import React, { useState } from 'react';
import { CredentialsManager } from './CredentialsManager';
import { PurchasedAppsManager } from './PurchasedAppsManager';
import { ClientTrelloManager } from './ClientTrelloManager';
import { SupportTicketsDashboard } from './SupportTicketsDashboard';

export function ClientDetail({ client, onBack, onEdit, onDelete, onUpdateType, currentUser }) {
  const isLead = client?.type === 'Lead';
  const [activeTab, setActiveTab] = useState('trello');
  const [pendingTypeChange, setPendingTypeChange] = useState(null); // { newType, label, description, color, icon }

  if (!client) return null;

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

  const handleRequestTypeChange = (newType) => {
    if (newType === 'Cliente') {
      setPendingTypeChange({
        newType: 'Cliente',
        icon: '⭐',
        label: 'Converter em Cliente',
        description: `Tem certeza que deseja converter "${client.name}" de Lead para Cliente? Essa ação irá liberar todos os módulos de cliente (Trello, Senhas, Tickets).`,
        confirmColor: '#10b981',
        confirmLabel: '⭐ Sim, converter em Cliente',
      });
    } else {
      setPendingTypeChange({
        newType: 'Lead',
        icon: '🎯',
        label: 'Voltar a ser Lead',
        description: `Tem certeza que deseja reverter "${client.name}" de Cliente para Lead? O contato perderá o acesso aos módulos de cliente.`,
        confirmColor: '#38bdf8',
        confirmLabel: '🎯 Sim, voltar a ser Lead',
      });
    }
  };

  const handleConfirmTypeChange = () => {
    if (pendingTypeChange && onUpdateType) {
      onUpdateType(client.id, pendingTypeChange.newType);
    }
    setPendingTypeChange(null);
  };

  return (
    <div className="detail-view" data-testid="client-detail">

      {/* POPUP DE CONFIRMAÇÃO DE MUDANÇA DE TIPO */}
      {pendingTypeChange && (
        <div
          data-testid="type-change-confirm-backdrop"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            data-testid="type-change-confirm-modal"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '440px',
              width: '90%',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{pendingTypeChange.icon}</div>
              <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                {pendingTypeChange.label}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {pendingTypeChange.description}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => setPendingTypeChange(null)}
                data-testid="type-change-cancel-btn"
                style={{ minWidth: '120px' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-dark"
                onClick={handleConfirmTypeChange}
                data-testid="type-change-confirm-btn"
                style={{
                  minWidth: '200px',
                  borderColor: pendingTypeChange.confirmColor,
                  color: pendingTypeChange.confirmColor,
                  fontWeight: '700'
                }}
              >
                {pendingTypeChange.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topo do Hub */}
      <div className="detail-header">
        <div>
          <button className="btn btn-dark" onClick={onBack} style={{ marginBottom: '1rem' }}>
            &larr; Voltar para Contatos
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2>{client.name}</h2>
            <span className={`badge ${isLead ? 'badge-lead' : 'badge-cliente'}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
              {isLead ? '🎯 Lead' : '✅ Cliente'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {currentUser?.role !== 'USER' && (
            isLead ? (
              onUpdateType && (
                <button 
                  className="btn btn-emerald" 
                  onClick={() => handleRequestTypeChange('Cliente')}
                  data-testid="convert-to-client-btn"
                >
                  ⭐ Converter em Cliente
                </button>
              )
            ) : (
              onUpdateType && (
                <button 
                  className="btn btn-dark" 
                  onClick={() => handleRequestTypeChange('Lead')}
                  style={{ borderColor: '#38bdf8', color: '#38bdf8' }}
                  data-testid="revert-to-lead-btn"
                >
                  🎯 Voltar a ser Lead
                </button>
              )
            )
          )}
          <button 
            className="btn btn-dark" 
            onClick={() => onEdit(client)}
            title="Editar contato"
          >
            ✏️ Editar
          </button>
          <button 
            className="btn btn-dark" 
            onClick={() => onDelete(client.id)}
            style={{ color: 'var(--badge-red-text)', borderColor: 'var(--badge-red-text)' }}
          >
            Excluir
          </button>
        </div>
      </div>


      {/* Layout com Sidebar Lateral de Abas + Conteúdo */}
      <div className="hub-layout">
        <aside className="hub-sidebar">
          <div className="hub-sidebar-title">MÓDULOS DO CONTATO</div>
          
          {/* Se for Lead, exibe Trello & Evolução e Visão Geral */}
          {isLead ? (
            <>
              <button 
                className={`hub-tab-btn ${activeTab === 'trello' ? 'active' : ''}`}
                onClick={() => setActiveTab('trello')}
                data-testid="contact-trello-tab-btn"
              >
                📋 Trello & Evolução
              </button>
              <button 
                className={`hub-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📄 Visão Geral
              </button>
            </>
          ) : (
            <>
              <button 
                className={`hub-tab-btn ${activeTab === 'trello' ? 'active' : ''}`}
                onClick={() => setActiveTab('trello')}
                data-testid="contact-trello-tab-btn"
              >
                📋 Trello & Evolução
              </button>
              {/* Aplicações Contratadas visível para SUPER_ADMIN e ADMIN */}
              {currentUser?.role !== 'USER' && (
                <button 
                  className={`hub-tab-btn ${activeTab === 'apps' ? 'active' : ''}`}
                  onClick={() => setActiveTab('apps')}
                >
                  📦 Aplicações Contratadas
                </button>
              )}
              <button 
                className={`hub-tab-btn ${activeTab === 'credentials' ? 'active' : ''}`}
                onClick={() => setActiveTab('credentials')}
              >
                🔑 Senhas & Acessos
              </button>
              <button 
                className={`hub-tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
                onClick={() => setActiveTab('tickets')}
                data-testid="contact-tickets-tab-btn"
              >
                🎫 Tickets de Suporte
              </button>
              <button 
                className={`hub-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📄 Visão Geral
              </button>
            </>
          )}
        </aside>

        <section className="hub-content">
          {activeTab === 'trello' ? (
            <ClientTrelloManager clientId={client.id} clientName={client.name} />
          ) : !isLead && activeTab === 'apps' ? (
            <PurchasedAppsManager clientId={client.id} clientName={client.name} />
          ) : !isLead && activeTab === 'credentials' ? (
            <CredentialsManager clientId={client.id} clientName={client.name} currentUser={currentUser} />
          ) : !isLead && activeTab === 'tickets' ? (
            <SupportTicketsDashboard clientId={client.id} clientName={client.name} currentUser={currentUser} />
          ) : (
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📄 Visão Geral do Contato
              </h3>

              <div className="detail-grid">
                <div className="detail-item">
                  <label>NOME DO CONTATO</label>
                  <span>{client.name}</span>
                </div>
                <div className="detail-item">
                  <label>TIPO DE CONTATO</label>
                  <span style={{ color: isLead ? '#38bdf8' : '#10b981' }}>{client.type}</span>
                </div>
                <div className="detail-item">
                  <label>DATA DE CADASTRO</label>
                  <span>{formatDate(client.created_at)}</span>
                </div>
              </div>

              {/* BLOCOS DE CONTATO & REDES E LOCALIZAÇÃO (SE PREENCHIDOS) */}
              {(client.email || client.phone_whatsapp || client.instagram || client.address || client.city || client.state) && (
                <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {(client.email || client.phone_whatsapp || client.instagram) && (
                    <div style={{ background: 'var(--bg-card-inner)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        📱 Contato & Redes
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                        {client.email && (
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>E-MAIL:</span>
                            <a href={`mailto:${client.email}`} style={{ color: '#38bdf8', textDecoration: 'none' }}>✉️ {client.email}</a>
                          </div>
                        )}
                        {client.phone_whatsapp && (
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>WHATSAPP / TELEFONE:</span>
                            <a href={`https://wa.me/${client.phone_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', textDecoration: 'none' }}>💬 {client.phone_whatsapp}</a>
                          </div>
                        )}
                        {client.instagram && (
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>INSTAGRAM:</span>
                            <a href={client.instagram.startsWith('http') ? client.instagram : `https://instagram.com/${client.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#ec4899', textDecoration: 'none' }}>📸 {client.instagram}</a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(client.address || client.city || client.state) && (
                    <div style={{ background: 'var(--bg-card-inner)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        📍 Endereço & Localização
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                        {client.address && (
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>ENDEREÇO:</span>
                            <span style={{ color: '#fff' }}>🏠 {client.address}</span>
                          </div>
                        )}
                        {(client.city || client.state) && (
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>CIDADE / ESTADO:</span>
                            <span style={{ color: '#fff' }}>🌆 {[client.city, client.state].filter(Boolean).join(' - ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isLead ? (
                <div style={{ marginTop: '1.25rem', padding: '1.25rem', backgroundColor: 'rgba(56, 189, 248, 0.05)', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <h3 style={{ color: '#38bdf8', marginBottom: '0.5rem', fontSize: '1rem' }}>🎯 Funil de Prospecção</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    Contato em fase de qualificação comercial e apresentação de proposta.
                  </p>
                </div>
              ) : (
                <div style={{ marginTop: '1.25rem', padding: '1.25rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h3 style={{ color: 'var(--emerald-primary)', marginBottom: '0.5rem', fontSize: '1rem' }}>🎧 Central de Atendimento</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    Cliente ativo com suporte habilitado.
                  </p>
                </div>
              )}

              {client.notes ? (
                <div style={{ marginTop: '1.25rem', padding: '1.25rem', backgroundColor: 'var(--bg-card-inner)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                    OBSERVAÇÕES INTERNAS
                  </label>
                  <p style={{ color: '#fff', whiteSpace: 'pre-wrap' }}>{client.notes}</p>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', marginTop: '1.25rem' }}>Sem observações cadastrais.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
