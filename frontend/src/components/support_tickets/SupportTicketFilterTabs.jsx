import React, { useState } from 'react';

function SearchableClientFilterCombobox({ clientFilter, setClientFilter, clientsWithTickets }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedClient = clientsWithTickets.find(c => c.id.toString() === clientFilter);
  const selectedLabel = clientFilter === 'Todos' ? 'Todos os Clientes' : (selectedClient ? selectedClient.name : 'Todos os Clientes');

  const filteredClients = clientsWithTickets.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.45rem 1rem 0.45rem 0.85rem',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          color: '#fff',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: '500',
          minWidth: '160px',
          justify: 'space-between'
        }}
        data-testid="ticket-client-filter-select"
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedLabel}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 1000,
          marginTop: '0.25rem',
          backgroundColor: '#151e32',
          border: '1px solid var(--emerald-primary)',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          padding: '0.5rem',
          minWidth: '220px',
          maxWidth: '300px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          <input 
            type="text"
            placeholder="🔍 Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem',
              backgroundColor: '#0b1120',
              color: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              outline: 'none'
            }}
            data-testid="ticket-client-filter-search-input"
          />

          <div style={{ overflowY: 'auto', maxHeight: '180px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div
              onClick={() => {
                setClientFilter('Todos');
                setIsOpen(false);
              }}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                backgroundColor: clientFilter === 'Todos' ? 'rgba(16,185,129,0.2)' : 'transparent',
                color: clientFilter === 'Todos' ? 'var(--emerald-primary)' : '#fff',
                fontWeight: clientFilter === 'Todos' ? '700' : '500'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = clientFilter === 'Todos' ? 'rgba(16,185,129,0.25)' : '#0b1120'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = clientFilter === 'Todos' ? 'rgba(16,185,129,0.2)' : 'transparent'}
            >
              Todos os Clientes
            </div>

            {filteredClients.length === 0 ? (
              <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Nenhum cliente encontrado
              </div>
            ) : (
              filteredClients.map(c => {
                const isSelected = c.id.toString() === clientFilter;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setClientFilter(c.id.toString());
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      backgroundColor: isSelected ? 'rgba(16,185,129,0.2)' : 'transparent',
                      color: isSelected ? 'var(--emerald-primary)' : '#fff',
                      fontWeight: isSelected ? '700' : '500'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isSelected ? 'rgba(16,185,129,0.25)' : '#0b1120'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? 'rgba(16,185,129,0.2)' : 'transparent'}
                  >
                    {c.name}
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

export function SupportTicketFilterTabs({
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  clientFilter,
  setClientFilter,
  clients = [],
  allTickets = [],
  isClientView = false,
  search,
  setSearch,
  statusCounts
}) {
  const tabs = [
    { key: 'Todos', label: 'Todos', icon: '📋', count: statusCounts?.all || 0 },
    { key: 'open', label: 'Abertos', icon: '🔴', count: statusCounts?.open || 0 },
    { key: 'in_progress', label: 'Em Andamento', icon: '⚡', count: statusCounts?.in_progress || 0 },
    { key: 'resolved', label: 'Resolvidos', icon: '✓', count: statusCounts?.resolved || 0 }
  ];

  // Filtra clientes que possuem pelo menos 1 ticket no status da aba selecionada
  const clientsWithTicketsInActiveTab = clients.filter(c => {
    if (statusFilter === 'Todos') {
      return allTickets.some(t => t.client_id === c.id);
    }
    return allTickets.some(t => t.client_id === c.id && t.status === statusFilter);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
      {/* Abas Superiores por Status */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        borderBottom: '1px solid var(--border-color)', 
        paddingBottom: '0.75rem',
        overflowX: 'auto'
      }}>
        {tabs.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: isActive ? 'var(--emerald-primary)' : 'var(--bg-card-inner)',
                color: isActive ? '#000' : 'var(--text-muted)',
                fontWeight: isActive ? '800' : '600',
                border: isActive ? '1px solid var(--emerald-primary)' : '1px solid var(--border-color)',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              data-testid={`status-tab-${tab.key}`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span style={{ 
                background: isActive ? 'rgba(0,0,0,0.2)' : 'var(--bg-card)', 
                color: isActive ? '#000' : '#fff',
                padding: '0.15rem 0.5rem', 
                borderRadius: '12px', 
                fontSize: '0.75rem',
                fontWeight: '700'
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Barra Secundária com Estilo Escuro Premium (Sem duplicar ícones) */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        background: 'var(--bg-card-inner)', 
        padding: '1rem 1.25rem', 
        borderRadius: '14px', 
        border: '1px solid var(--border-color)',
        alignItems: 'center',
        flexWrap: 'wrap',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Campo de Busca Limpo */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <span style={{ 
            position: 'absolute', 
            left: '0.85rem', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            fontSize: '0.9rem',
            opacity: 0.7 
          }}>
            🔍
          </span>
          <input 
            type="text" 
            placeholder="Pesquisar por título ou descrição..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', 
              fontSize: '0.85rem', 
              paddingLeft: '2.4rem',
              paddingRight: '1rem',
              paddingTop: '0.55rem',
              paddingBottom: '0.55rem',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              color: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              outline: 'none'
            }}
          />
        </div>

        {/* Dropdown de Filtro por Cliente (Caso não esteja dentro da visão de um cliente específico) */}
        {!isClientView && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Cliente:</span>
            <SearchableClientFilterCombobox 
              clientFilter={clientFilter}
              setClientFilter={setClientFilter}
              clientsWithTickets={clientsWithTicketsInActiveTab}
            />
          </div>
        )}

        {/* Dropdown de Filtro por Tipo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Tipo:</span>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ 
              fontSize: '0.85rem', 
              padding: '0.55rem 0.85rem',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              color: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="Todos" style={{ background: '#0f172a', color: '#fff' }}>Todos os Tipos</option>
            <option value="bug" style={{ background: '#0f172a', color: '#fff' }}>🐛 Problema / Bug</option>
            <option value="enhancement" style={{ background: '#0f172a', color: '#fff' }}>💡 Pedido de Melhoria</option>
          </select>
        </div>
      </div>
    </div>
  );
}
