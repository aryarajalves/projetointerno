import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SupportTicketsDashboard } from '../components/SupportTicketsDashboard';
import { ToastProvider } from '../components/Toast';

describe('SupportTicketsDashboard Component Tests', () => {
  it('renders support tickets dashboard, loads tickets and opens creation modal', async () => {
    const mockTickets = [
      {
        id: 1,
        client_id: 1,
        client_name: 'Beatriz Barbosa',
        app_name: 'AgentFlow',
        ticket_type: 'bug',
        title: 'Erro na sincronização de mensagens',
        description: 'Descrição detalhada do bug',
        status: 'open',
        priority: 'high',
        created_at: '2026-08-03T17:00:00.000Z',
        attachments: []
      }
    ];

    const mockClients = {
      items: [
        { id: 1, name: 'Beatriz Barbosa', type: 'Cliente' }
      ]
    };

    globalThis.fetch = vi.fn((url) => {
      if (url.includes('/api/tickets')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockTickets
        });
      }
      if (url.includes('/api/clients')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockClients
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <ToastProvider>
        <SupportTicketsDashboard />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Erro na sincronização de mensagens')).toBeInTheDocument();
      expect(screen.getAllByText('Beatriz Barbosa')[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('open-create-ticket-modal-btn'));
    expect(screen.getByTestId('create-ticket-modal-backdrop')).toBeInTheDocument();
  });

  it('filters tickets by status tabs and renders pagination controls', async () => {
    const mockTickets = [
      { id: 1, client_id: 1, client_name: 'Beatriz', app_name: 'AgentFlow', ticket_type: 'bug', title: 'Ticket 1', status: 'open', priority: 'medium', attachments: [] },
      { id: 2, client_id: 1, client_name: 'Beatriz', app_name: 'ZapJords', ticket_type: 'enhancement', title: 'Ticket 2', status: 'resolved', priority: 'low', attachments: [] }
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTickets
    });

    render(
      <ToastProvider>
        <SupportTicketsDashboard />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status-tab-open')).toBeInTheDocument();
      expect(screen.getByTestId('status-tab-resolved')).toBeInTheDocument();
    });

    // Clicar na aba "Abertos"
    fireEvent.click(screen.getByTestId('status-tab-open'));
    expect(screen.getByText('Ticket 1')).toBeInTheDocument();
    expect(screen.queryByText('Ticket 2')).not.toBeInTheDocument();

    // Controles de paginação
    expect(screen.getByTestId('pagination-prev-btn')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-next-btn')).toBeInTheDocument();
  });

  it('renders client filter dropdown in main view', async () => {
    const mockClients = {
      items: [
        { id: 1, name: 'Beatriz Barbosa', type: 'Cliente' },
        { id: 2, name: 'Carlos Jords', type: 'Cliente' }
      ]
    };

    globalThis.fetch = vi.fn((url) => {
      if (url.includes('/api/clients')) {
        return Promise.resolve({ ok: true, json: async () => mockClients });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(
      <ToastProvider>
        <SupportTicketsDashboard />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('ticket-client-filter-select')).toBeInTheDocument();
      expect(screen.getByText('Todos os Clientes')).toBeInTheDocument();
    });
  });

  it('only displays clients with tickets matching the active status tab in client filter dropdown', async () => {
    const mockClients = {
      items: [
        { id: 1, name: 'Cliente Com Ticket Aberto', type: 'Cliente' },
        { id: 2, name: 'Cliente Com Ticket Resolvido', type: 'Cliente' },
        { id: 3, name: 'Cliente Sem Tickets', type: 'Cliente' }
      ]
    };

    const mockTickets = [
      { id: 10, client_id: 1, status: 'open', title: 'Ticket Aberto C1' },
      { id: 20, client_id: 2, status: 'resolved', title: 'Ticket Resolvido C2' }
    ];

    globalThis.fetch = vi.fn((url) => {
      if (url.includes('/api/clients')) {
        return Promise.resolve({ ok: true, json: async () => mockClients });
      }
      if (url.includes('/api/tickets')) {
        return Promise.resolve({ ok: true, json: async () => mockTickets });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <ToastProvider>
        <SupportTicketsDashboard />
      </ToastProvider>
    );

    // 1. Na aba inicial 'open' (Abertos):
    await waitFor(() => {
      expect(screen.getByTestId('ticket-client-filter-select')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('ticket-client-filter-select'));
    expect(screen.getByText('Cliente Com Ticket Aberto')).toBeInTheDocument();
    expect(screen.queryByText('Cliente Com Ticket Resolvido')).not.toBeInTheDocument();
    expect(screen.queryByText('Cliente Sem Tickets')).not.toBeInTheDocument();

    // Fechar combobox antes de trocar de aba
    fireEvent.click(screen.getByTestId('ticket-client-filter-select'));

    // 2. Mudar para a aba 'Todos'
    fireEvent.click(screen.getByTestId('status-tab-Todos'));
    fireEvent.click(screen.getByTestId('ticket-client-filter-select'));
    expect(screen.getByText('Cliente Com Ticket Aberto')).toBeInTheDocument();
    expect(screen.getByText('Cliente Com Ticket Resolvido')).toBeInTheDocument();
    expect(screen.queryByText('Cliente Sem Tickets')).not.toBeInTheDocument();
  });
});
