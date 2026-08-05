import React, { useState, useEffect } from 'react';

export function FinancialDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/finance/summary`);
      if (!res.ok) throw new Error('Falha ao carregar métricas financeiras');
      const data = await res.json();
      setSummary(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os dados financeiros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>Carregando dados financeiros...</p>;
  }

  if (error) {
    return (
      <div style={{ color: 'var(--badge-red-text)', background: 'var(--badge-red-bg)', padding: '1rem', borderRadius: '8px', marginTop: '2rem' }}>
        {error}
      </div>
    );
  }

  return (
    <div data-testid="financial-dashboard">
      {/* Header do Módulo Financeiro */}
      <div className="hero-header" style={{ marginBottom: '2rem' }}>
        <div className="hero-title-group">
          <div className="icon-circle-emerald">💰</div>
          <div>
            <h1 className="hero-title">Painel Financeiro</h1>
            <p className="hero-desc">Visão consolidada de vendas e faturamento (Dia, Mês, Ano e Total Geral).</p>
          </div>
        </div>
        <button 
          type="button" 
          className="btn btn-dark" 
          onClick={fetchSummary}
          style={{ fontSize: '0.85rem' }}
        >
          🔄 Atualizar Dados
        </button>
      </div>

      {/* Grid com os 4 Cards Principais de Faturamento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {/* Card Hoje */}
        <div style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '14px', 
          padding: '1.5rem',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              FATURAMENTO HOJE
            </span>
            <span style={{ fontSize: '1.2rem' }}>☀️</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff' }}>
            {formatCurrency(summary.today_revenue)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--emerald-primary)', fontWeight: '600', marginTop: '0.4rem', display: 'block' }}>
            Vendas realizadas hoje
          </span>
        </div>

        {/* Card Mês */}
        <div style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--emerald-primary)', 
          borderRadius: '14px', 
          padding: '1.5rem',
          boxShadow: '0 8px 20px rgba(0,0,0,0.4), 0 0 15px var(--emerald-glow)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--emerald-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              FATURAMENTO ESTE MÊS
            </span>
            <span style={{ fontSize: '1.2rem' }}>📅</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--emerald-primary)' }}>
            {formatCurrency(summary.month_revenue)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.4rem', display: 'block' }}>
            Mês vigente
          </span>
        </div>

        {/* Card Ano */}
        <div style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '14px', 
          padding: '1.5rem',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              FATURAMENTO ESTE ANO
            </span>
            <span style={{ fontSize: '1.2rem' }}>🗓️</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff' }}>
            {formatCurrency(summary.year_revenue)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: '600', marginTop: '0.4rem', display: 'block' }}>
            Ano vigente
          </span>
        </div>

        {/* Card Total Geral */}
        <div style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '14px', 
          padding: '1.5rem',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TOTAL HISTÓRICO GERAL
            </span>
            <span style={{ fontSize: '1.2rem' }}>💎</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#38bdf8' }}>
            {formatCurrency(summary.total_revenue)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.4rem', display: 'block' }}>
            Acumulado total de vendas
          </span>
        </div>
      </div>

      {/* Detalhamento por Ferramentas */}
      <div>
        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📊 Desempenho por Aplicação Contratada
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {summary.apps_summary.map((app) => (
            <div 
              key={app.name}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{app.icon}</span>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#fff' }}>{app.name}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Total de Licenças Compradas: <strong style={{ color: '#fff' }}>{app.sales_count}</strong>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>FATURADO</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--emerald-primary)' }}>
                  {formatCurrency(app.total_sales)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
