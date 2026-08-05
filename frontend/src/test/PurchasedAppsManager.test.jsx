import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PurchasedAppsManager } from '../components/PurchasedAppsManager';
import { ToastProvider } from '../components/Toast';

describe('PurchasedAppsManager Component Tests', () => {
  it('renders purchased apps manager with apps grid and supports installment options', async () => {
    const mockApps = [
      {
        id: 1,
        client_id: 1,
        app_name: 'AgentFlow',
        price: 2000.0,
        payment_status: 'installment',
        installments_count: 2,
        installments: [
          { id: 101, app_id: 1, installment_number: 1, amount: 1000.0, due_date: '2026-08-10', status: 'paid' },
          { id: 102, app_id: 1, installment_number: 2, amount: 1000.0, due_date: '2026-09-10', status: 'pending' }
        ]
      }
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApps
    });

    render(
      <ToastProvider>
        <PurchasedAppsManager clientId={1} clientName="Beatriz Barbosa" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('AgentFlow')).toBeInTheDocument();
      expect(screen.getByTestId('view-installments-btn-AgentFlow')).toBeInTheDocument();
    });

    expect(screen.getByText(/Parcelado \(1\/2 pagas\)/)).toBeInTheDocument();
  });

  it('displays renewal date when set on purchased app', async () => {
    const mockApps = [
      {
        id: 2,
        client_id: 1,
        app_name: 'ZapJords',
        price: 3000.0,
        payment_status: 'paid',
        renewal_date: '2027-08-10',
        installments: []
      }
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApps
    });

    render(
      <ToastProvider>
        <PurchasedAppsManager clientId={1} clientName="Beatriz Barbosa" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ZapJords')).toBeInTheDocument();
      expect(screen.getByText(/10\/08\/2027/)).toBeInTheDocument();
    });
  });
});
