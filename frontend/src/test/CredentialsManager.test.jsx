import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CredentialsManager } from '../components/CredentialsManager';
import { ToastProvider } from '../components/Toast';

describe('CredentialsManager Component Tests', () => {
  it('renders credentials manager and displays superadmin-only toggle in creation modal', async () => {
    const mockCredentialsResponse = {
      items: [
        {
          id: 1,
          client_id: 10,
          title: 'Credencial ZapGroup SuperAdmin',
          access_url: 'https://zapgroup.com',
          username: 'superadmin@zap.com',
          password: 'secretpassword',
          is_superadmin_only: true,
          created_at: '2026-08-04T10:00:00.000Z'
        }
      ],
      total: 1,
      page: 1,
      limit: 10,
      pages: 1
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCredentialsResponse
    });

    const superAdminUser = { id: 1, name: 'Arya Admin', role: 'SUPER_ADMIN' };

    render(
      <ToastProvider>
        <CredentialsManager clientId={10} clientName="Cliente Teste" currentUser={superAdminUser} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Credencial ZapGroup SuperAdmin/)).toBeInTheDocument();
      expect(screen.getByTestId('superadmin-badge-1')).toBeInTheDocument();
      expect(screen.getByText(/Apenas Super Admin/)).toBeInTheDocument();
    });

    // Abrir modal de criação
    fireEvent.click(screen.getByTestId('add-credential-btn'));
    expect(screen.getByTestId('cred-form-modal-backdrop')).toBeInTheDocument();

    // Verificar se o toggle de Super Admin está presente no modal
    const toggle = screen.getByTestId('cred-superadmin-only-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle.checked).toBe(false);

    // Clicar no toggle
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(true);
  });
});
