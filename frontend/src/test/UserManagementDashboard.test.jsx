import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserManagementDashboard } from '../components/UserManagementDashboard';
import { ToastProvider } from '../components/Toast';

describe('UserManagementDashboard Component Tests', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/users/invites')) {
        return Promise.resolve({
          ok: true,
          json: async () => Array.from({ length: 30 }, (_, i) => ({
            id: i + 1,
            token: `token_sample_${i + 1}_abcdef`,
            role: 'ADMIN',
            expires_at: '2026-12-31T23:59:59',
            valid_hours: 24,
            used: false
          }))
        });
      }
      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            name: `Usuário ${i + 1}`,
            email: `usuario${i + 1}@exemplo.com`,
            role: i === 0 ? 'SUPER_ADMIN' : 'ADMIN'
          }))
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders users limit select with 20 by default and allows changing to 50', async () => {
    render(
      <ToastProvider>
        <UserManagementDashboard />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('users-limit-select')).toBeInTheDocument();
    });

    const usersLimitSelect = screen.getByTestId('users-limit-select');
    expect(usersLimitSelect.value).toBe('20');

    fireEvent.change(usersLimitSelect, { target: { value: '50' } });
    expect(usersLimitSelect.value).toBe('50');
  });

  it('renders invites limit select with 20 by default when switching to invites tab', async () => {
    render(
      <ToastProvider>
        <UserManagementDashboard />
      </ToastProvider>
    );

    const invitesTabBtn = screen.getByText(/Links de Convite/i);
    fireEvent.click(invitesTabBtn);

    await waitFor(() => {
      expect(screen.getByTestId('invites-limit-select')).toBeInTheDocument();
    });

    const invitesLimitSelect = screen.getByTestId('invites-limit-select');
    expect(invitesLimitSelect.value).toBe('20');

    fireEvent.change(invitesLimitSelect, { target: { value: '100' } });
    expect(invitesLimitSelect.value).toBe('100');
  });
});
