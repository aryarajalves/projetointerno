import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClientCard } from '../components/ClientCard';
import { ClientFormModal } from '../components/ClientFormModal';
import { ClientEditModal } from '../components/ClientEditModal';

import { ClientDetail } from '../components/ClientDetail';
import { ToastProvider } from '../components/Toast';

// Mock do axios para evitar requisições reais nos componentes filhos de ClientDetail
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} }))
  }
}));

describe('Frontend Component Tests', () => {
  const mockClient = {
    id: 1,
    name: 'Cliente Simplificado',
    type: 'Lead',
    notes: 'Observações de teste',
    created_at: '2026-08-03T14:30:00.000Z'
  };

  it('renders PurchasedAppsManager when clicking on Aplicações Contratadas tab in ClientDetail for a Cliente', async () => {
    const mockClienteActual = { ...mockClient, type: 'Cliente' };
    const adminUser = { role: 'ADMIN' };

    render(
      <ToastProvider>
        <ClientDetail 
          client={mockClienteActual} 
          currentUser={adminUser}
        />
      </ToastProvider>
    );

    const appsTabBtn = screen.getByText(/Aplicações Contratadas/i);
    expect(appsTabBtn).toBeInTheDocument();

    fireEvent.click(appsTabBtn);

    // Deve exibir o cabeçalho de Aplicações Contratadas do PurchasedAppsManager
    expect(await screen.findByText(/Registre e consulte quais ferramentas/i)).toBeInTheDocument();
  });

  it('renders ClientCard correctly with Lead badge, Edit and Delete buttons', () => {
    const handleClick = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    render(
      <ClientCard 
        client={mockClient} 
        onClick={handleClick} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />
    );

    expect(screen.getByText('Cliente Simplificado')).toBeInTheDocument();
    expect(screen.getByText('🎯 Lead')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('edit-client-btn-1'));
    expect(handleEdit).toHaveBeenCalledWith(mockClient);

    fireEvent.click(screen.getByTestId('delete-client-btn-1'));
    expect(handleDelete).toHaveBeenCalledWith(1);
  });

  it('renders ClientEditModal and submits updated information', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();

    render(
      <ClientEditModal 
        isOpen={true} 
        client={mockClient} 
        onClose={handleClose} 
        onSave={handleSave} 
      />
    );

    expect(screen.getByTestId('edit-modal-backdrop')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/NOME DO CONTATO/i), { target: { value: 'Cliente Editado' } });
    fireEvent.submit(screen.getByTestId('edit-client-form'));

    expect(handleSave).toHaveBeenCalledWith(1, expect.objectContaining({
      name: 'Cliente Editado',
      type: 'Lead'
    }));
    expect(handleClose).toHaveBeenCalled();
  });

  it('shows server fields only when currentUser is SUPER_ADMIN', () => {
    const superAdminUser = { role: 'SUPER_ADMIN' };
    const adminUser = { role: 'ADMIN' };
    const handleSave = vi.fn();

    // SUPER_ADMIN deve ver os botões de abas e os campos ao clicar na aba Servidor
    const { unmount } = render(
      <ClientEditModal 
        isOpen={true} 
        client={mockClient} 
        onClose={vi.fn()} 
        onSave={handleSave}
        currentUser={superAdminUser}
      />
    );
    expect(screen.getByTestId('modal-tab-server')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('modal-tab-server'));

    expect(screen.getByTestId('edit-server-ip-input')).toBeInTheDocument();
    expect(screen.getByTestId('edit-server-password-input')).toBeInTheDocument();
    unmount();

    // ADMIN NÃO deve ver as abas adicionais nem os campos de servidor
    render(
      <ClientEditModal 
        isOpen={true} 
        client={mockClient} 
        onClose={vi.fn()} 
        onSave={handleSave}
        currentUser={adminUser}
      />
    );
    expect(screen.queryByTestId('modal-tab-server')).not.toBeInTheDocument();
    expect(screen.queryByTestId('edit-server-ip-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('edit-server-password-input')).not.toBeInTheDocument();
  });
});
