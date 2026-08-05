import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';

export function InviteRegisterModal({ token, onClose, onRegisterSuccess }) {
  const { showToast } = useToast();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/users/invites/${token}`);
        if (res.ok) {
          const data = await res.json();
          setInvite(data);
        } else {
          const errData = await res.json();
          setErrorMsg(errData.detail || 'Link de convite inválido ou expirado.');
        }
      } catch (err) {
        setErrorMsg('Erro ao carregar dados do convite.');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchInvite();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/users/invites/${token}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      if (res.ok) {
        if (showToast) showToast('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
        if (onRegisterSuccess) onRegisterSuccess();
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Erro ao realizar cadastro.');
      }
    } catch (err) {
      alert('Erro de conexão ao realizar cadastro.');
    }
  };

  return (
    <div className="modal-backdrop" data-testid="invite-register-modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Criar Sua Conta</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Você foi convidado como <strong style={{ color: 'var(--emerald-primary)' }}>{invite?.role || 'Usuário'}</strong>.
        </p>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Validando convite...</p>
        ) : errorMsg ? (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '10px', color: '#fca5a5', textAlign: 'center' }}>
            <p style={{ margin: 0, fontWeight: '700' }}>⚠️ Convite Inválido</p>
            <p style={{ margin: '0.5rem 0 1rem 0', fontSize: '0.85rem' }}>{errorMsg}</p>
            <button type="button" className="btn btn-dark" onClick={onClose}>Voltar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label>SEU NOME COMPLETO *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Carlos Silva"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoComplete="new-name"
                style={{ background: 'var(--bg-dark)', color: '#ffffff' }}
              />
            </div>

            <div className="form-group">
              <label>ENDEREÇO DE E-MAIL *</label>
              <input 
                type="email" 
                required 
                placeholder="carlos@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                autoComplete="new-email"
                style={{ background: 'var(--bg-dark)', color: '#ffffff' }}
              />
            </div>

            <div className="form-group">
              <label>SENHA DE ACESSO *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  autoComplete="new-password"
                  style={{ background: 'var(--bg-dark)', color: '#ffffff', paddingRight: '2.5rem', width: '100%' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '0.75rem', 
                    background: 'transparent', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '1.1rem', 
                    opacity: 0.7,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>CONFIRMAR SENHA *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  required 
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                  style={{ background: 'var(--bg-dark)', color: '#ffffff', paddingRight: '2.5rem', width: '100%' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '0.75rem', 
                    background: 'transparent', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '1.1rem', 
                    opacity: 0.7,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showConfirmPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-dark" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-emerald">
                Concluir Cadastro
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
