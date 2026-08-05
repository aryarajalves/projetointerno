import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '../components/Sidebar';

describe('Sidebar Component Tests', () => {
  it('renders sidebar correctly with user email and navigation links without crashing', () => {
    const mockOnSelectTab = vi.fn();
    const mockOnLogout = vi.fn();
    const currentUser = { email: 'aryarajmarketing@gmail.com', role: 'SUPER_ADMIN' };

    render(
      <Sidebar 
        currentUser={currentUser} 
        activeTab="contacts" 
        onSelectTab={mockOnSelectTab} 
        onLogout={mockOnLogout} 
      />
    );

    expect(screen.getByTestId('main-sidebar')).toBeInTheDocument();
    expect(screen.getByText('aryarajmarketing@gmail.com')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-contacts-btn')).toBeInTheDocument();
    expect(screen.getByTestId('users-management-nav-btn')).toBeInTheDocument();
    expect(screen.getByTestId('finance-nav-btn')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('finance-nav-btn'));
    expect(mockOnSelectTab).toHaveBeenCalledWith('finance');
  });

  it('hides users management navigation button for non-SUPER_ADMIN users', () => {
    const mockOnSelectTab = vi.fn();
    const mockOnLogout = vi.fn();
    const adminUser = { email: 'admin@empresa.com', role: 'ADMIN' };

    render(
      <Sidebar 
        currentUser={adminUser} 
        activeTab="contacts" 
        onSelectTab={mockOnSelectTab} 
        onLogout={mockOnLogout} 
      />
    );

    expect(screen.queryByTestId('users-management-nav-btn')).not.toBeInTheDocument();
  });
});
