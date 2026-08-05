import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Login } from '../components/Login';

describe('Login Component Tests', () => {
  it('renders login form and submits credentials successfully calling onLoginSuccess with token and user', async () => {
    const mockOnLoginSuccess = vi.fn();

    const fakeResponse = {
      token: 'fake-jwt-token-123',
      user: { id: 'user-1', email: 'aryarajmarketing@gmail.com', role: 'SUPER_ADMIN' }
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeResponse
    });

    render(<Login onLoginSuccess={mockOnLoginSuccess} />);

    expect(screen.getByTestId('login-card')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('login-email-input'), {
      target: { value: 'aryarajmarketing@gmail.com' }
    });
    fireEvent.change(screen.getByTestId('login-password-input'), {
      target: { value: '123456' }
    });

    fireEvent.click(screen.getByTestId('login-submit-btn'));

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith(
        'fake-jwt-token-123',
        expect.objectContaining({ email: 'aryarajmarketing@gmail.com', role: 'SUPER_ADMIN' })
      );
    });

    expect(localStorage.getItem('auth_token')).toBe('fake-jwt-token-123');
    expect(localStorage.getItem('auth_user')).toContain('aryarajmarketing@gmail.com');
  });
});
