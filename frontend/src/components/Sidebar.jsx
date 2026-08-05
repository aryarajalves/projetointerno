import React, { useState } from 'react';

// Helper para renderizar um botão de navegação da sidebar
function NavButton({ icon, label, tab, activeTab, onSelectTab, testId }) {
  const isActive = activeTab === tab;
  return (
    <button
      type="button"
      className={`sidebar-link ${isActive ? 'active' : ''}`}
      onClick={() => onSelectTab(tab)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        width: '100%',
        padding: '0.65rem 1rem',
        borderRadius: '10px',
        background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
        border: isActive ? '1px solid var(--emerald-primary)' : '1px solid transparent',
        color: '#fff',
        fontWeight: '700',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '0.9rem',
        transition: 'background 0.15s ease, border-color 0.15s ease'
      }}
      data-testid={testId}
    >
      <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// Label separador de categoria
function CategoryLabel({ label }) {
  return (
    <div style={{
      padding: '0.6rem 0.25rem 0.25rem 0.25rem',
      fontSize: '0.6rem',
      fontWeight: '800',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.1em'
    }}>
      {label}
    </div>
  );
}

export function Sidebar({ user, currentUser, activeTab, onSelectTab, onLogout }) {
  const activeUser = currentUser || user;
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleConfirmLogout = () => {
    setShowConfirmModal(false);
    onLogout();
  };

  const handleSidebarWheel = (e) => {
    e.stopPropagation();
    const el = e.currentTarget;
    const isScrollable = el.scrollHeight > el.clientHeight;

    if (!isScrollable) {
      e.preventDefault();
    } else {
      const isAtTop = el.scrollTop === 0 && e.deltaY < 0;
      const isAtBottom = Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 2 && e.deltaY > 0;
      if (isAtTop || isAtBottom) {
        e.preventDefault();
      }
    }
  };

  return (
    <>
      <aside className="main-sidebar" data-testid="main-sidebar" onWheel={handleSidebarWheel}>
        <div>
          {/* Logo & Header da Sidebar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--bg-card-inner)',
              border: '1px solid var(--emerald-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              boxShadow: '0 0 10px var(--emerald-glow)'
            }}>
              📇
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>Gerenciador</h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--emerald-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                DE CLIENTES
              </span>
            </div>
          </div>

          {/* Menu de Navegação da Sidebar */}
          <nav style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>

            {/* ─── Categoria: OPERACIONAL ─── */}
            <CategoryLabel label="⚡ Operacional" />

            <NavButton
              icon="📇"
              label="Gestão de Contatos"
              tab="contacts"
              activeTab={activeTab}
              onSelectTab={onSelectTab}
              testId="sidebar-contacts-btn"
            />

            {activeUser?.role !== 'USER' && (
              <NavButton
                icon="🎫"
                label="Central de Suporte"
                tab="tickets"
                activeTab={activeTab}
                onSelectTab={onSelectTab}
                testId="sidebar-tickets-btn"
              />
            )}

            {/* ─── Categoria: GESTÃO (apenas SUPER_ADMIN e ADMIN) ─── */}
            {activeUser?.role !== 'USER' && (
              <>
                <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.6rem 0 0 0' }} />
                <CategoryLabel label="⚙️ Gestão" />

                {activeUser?.role === 'SUPER_ADMIN' && (
                  <>
                    <NavButton
                      icon="👥"
                      label="Gestão de Usuários"
                      tab="users"
                      activeTab={activeTab}
                      onSelectTab={onSelectTab}
                      testId="users-management-nav-btn"
                    />

                    <NavButton
                      icon="🚀"
                      label="Atualizar Stacks"
                      tab="stack-update"
                      activeTab={activeTab}
                      onSelectTab={onSelectTab}
                      testId="stack-update-nav-btn"
                    />
                  </>
                )}

                <NavButton
                  icon="💰"
                  label="Financeiro"
                  tab="finance"
                  activeTab={activeTab}
                  onSelectTab={onSelectTab}
                  testId="finance-nav-btn"
                />
              </>
            )}
          </nav>
        </div>

        {/* Rodapé da Sidebar com Dados do Usuário & Botão de Sair */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
          <div style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
              CONECTADO COMO
            </span>
            <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
              {activeUser?.email || 'aryarajmarketing@gmail.com'}
            </div>
            <span className="badge badge-cliente" style={{ fontSize: '0.65rem', marginTop: '0.3rem', display: 'inline-block' }}>
              {activeUser?.role || 'SUPER ADMIN'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="btn btn-dark"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderColor: '#ef4444', color: '#fca5a5' }}
            data-testid="logout-btn"
          >
            <span>↪</span>
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* Modal de Confirmação de Saída centralizado */}
      {showConfirmModal && (
        <div className="modal-backdrop" data-testid="logout-modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ color: 'var(--badge-red-text)', marginBottom: '0.75rem' }}>Deseja Sair?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Tem certeza que deseja encerrar sua sessão e retornar à tela de login?
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-dark"
                onClick={handleConfirmLogout}
                style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
                data-testid="confirm-logout-btn"
              >
                Sim, Sair da Conta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
