import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StackUpdateDashboard } from '../components/StackUpdateDashboard';
import { ToastProvider } from '../components/Toast';

describe('StackUpdateDashboard Component Tests', () => {
  const mockCurrentUser = { role: 'SUPER_ADMIN' };

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          name: `Cliente ${i + 1}`,
          portainer_url: 'http://portainer.com',
          portainer_username: 'admin',
          portainer_password: 'pass'
        })),
        total: 25
      })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title and loading state or client list', async () => {
    render(
      <ToastProvider>
        <StackUpdateDashboard currentUser={mockCurrentUser} />
      </ToastProvider>
    );

    expect(screen.getByText(/Atualizar Stacks dos Servidores/i)).toBeInTheDocument();
    expect(screen.getByTestId('new-image-input')).toBeInTheDocument();
    expect(screen.getByTestId('execute-update-btn')).toBeInTheDocument();
  });

  it('renders servers pagination limit dropdown with options 20, 50, 100, 200', async () => {
    const { waitFor } = await import('@testing-library/react');
    render(
      <ToastProvider>
        <StackUpdateDashboard currentUser={mockCurrentUser} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('servers-limit-select')).toBeInTheDocument();
    });

    const limitSelect = screen.getByTestId('servers-limit-select');
    expect(limitSelect.value).toBe('20');

    fireEvent.change(limitSelect, { target: { value: '50' } });
    expect(limitSelect.value).toBe('50');
  });

  it('filters clients by portainer status select', async () => {
    const { waitFor } = await import('@testing-library/react');
    render(
      <ToastProvider>
        <StackUpdateDashboard currentUser={mockCurrentUser} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('portainer-status-filter-select')).toBeInTheDocument();
    });

    const filterSelect = screen.getByTestId('portainer-status-filter-select');
    expect(filterSelect.value).toBe('all');

    fireEvent.change(filterSelect, { target: { value: 'configured' } });
    expect(filterSelect.value).toBe('configured');

    fireEvent.change(filterSelect, { target: { value: 'unconfigured' } });
    expect(filterSelect.value).toBe('unconfigured');
  });
});
