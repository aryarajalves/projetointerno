import React, { useState } from 'react';
import { useToast } from './Toast';

export function ClientFormModal({ isOpen, onClose, onSave }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('principal');

  const [name, setName] = useState('');
  const [type, setType] = useState('Lead');
  const [notes, setNotes] = useState('');

  // Campos opcionais adicionais
  const [email, setEmail] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name,
      type,
      notes,
      email: email || null,
      phone_whatsapp: phoneWhatsapp || null,
      instagram: instagram || null,
      address: address || null,
      city: city || null,
      state: state || null
    });
    if (showToast) {
      showToast('Novo contato criado com sucesso!', 'success');
    }
    setName('');
    setType('Lead');
    setNotes('');
    setEmail('');
    setPhoneWhatsapp('');
    setInstagram('');
    setAddress('');
    setCity('');
    setState('');
    setActiveTab('principal');
    onClose();
  };

  return (
    <div className="modal-backdrop" data-testid="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        <h2 style={{ marginBottom: '1rem' }}>Novo Contato</h2>

        {/* NAVEGAÇÃO POR ABAS NO FORMULÁRIO DE CRIAÇÃO */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.4rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('principal')}
            style={{
              padding: '0.5rem 0.25rem',
              borderRadius: '8px',
              border: activeTab === 'principal' ? '1px solid var(--emerald-primary)' : '1px solid var(--border-color)',
              background: activeTab === 'principal' ? 'var(--emerald-primary)' : 'var(--bg-card-inner)',
              color: activeTab === 'principal' ? '#000' : 'var(--text-muted)',
              fontWeight: activeTab === 'principal' ? '800' : '600',
              cursor: 'pointer',
              fontSize: '0.78rem',
              textAlign: 'center'
            }}
            data-testid="create-tab-principal"
          >
            👤 Principal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contato')}
            style={{
              padding: '0.5rem 0.25rem',
              borderRadius: '8px',
              border: activeTab === 'contato' ? '1px solid #3b82f6' : '1px solid var(--border-color)',
              background: activeTab === 'contato' ? '#3b82f6' : 'var(--bg-card-inner)',
              color: activeTab === 'contato' ? '#fff' : 'var(--text-muted)',
              fontWeight: activeTab === 'contato' ? '800' : '600',
              cursor: 'pointer',
              fontSize: '0.78rem',
              textAlign: 'center'
            }}
            data-testid="create-tab-contato"
          >
            📱 Contato & Redes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('localizacao')}
            style={{
              padding: '0.5rem 0.25rem',
              borderRadius: '8px',
              border: activeTab === 'localizacao' ? '1px solid #8b5cf6' : '1px solid var(--border-color)',
              background: activeTab === 'localizacao' ? '#8b5cf6' : 'var(--bg-card-inner)',
              color: activeTab === 'localizacao' ? '#fff' : 'var(--text-muted)',
              fontWeight: activeTab === 'localizacao' ? '800' : '600',
              cursor: 'pointer',
              fontSize: '0.78rem',
              textAlign: 'center'
            }}
            data-testid="create-tab-localizacao"
          >
            📍 Localização
          </button>
        </div>

        <form onSubmit={handleSubmit} data-testid="client-form" autoComplete="off">
          {/* ABA 1: PRINCIPAL */}
          {activeTab === 'principal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="name">NOME DO CONTATO *</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ana Silva"
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">TIPO DE CONTATO *</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  data-testid="contact-type-select"
                >
                  <option value="Lead">🎯 Lead (Prospecção / Em negociação)</option>
                  <option value="Cliente">✅ Cliente (Ativo / Contratado)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes">NOTAS / OBSERVAÇÕES (OPCIONAL)</label>
                <textarea
                  id="notes"
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações importantes sobre o contato..."
                ></textarea>
              </div>
            </div>
          )}

          {/* ABA 2: CONTATO & REDES */}
          {activeTab === 'contato' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="create-email">E-MAIL (OPCIONAL)</label>
                <input
                  id="create-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@empresa.com"
                  data-testid="create-input-email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="create-phone">WHATSAPP / TELEFONE (OPCIONAL)</label>
                <input
                  id="create-phone"
                  type="text"
                  value={phoneWhatsapp}
                  onChange={(e) => setPhoneWhatsapp(e.target.value)}
                  placeholder="(11) 99999-9999"
                  data-testid="create-input-phone"
                />
              </div>

              <div className="form-group">
                <label htmlFor="create-instagram">INSTAGRAM (OPCIONAL)</label>
                <input
                  id="create-instagram"
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@usuario ou link do perfil"
                  data-testid="create-input-instagram"
                />
              </div>
            </div>
          )}

          {/* ABA 3: LOCALIZAÇÃO */}
          {activeTab === 'localizacao' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="create-address">ENDEREÇO (OPCIONAL)</label>
                <input
                  id="create-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro"
                  data-testid="create-input-address"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label htmlFor="create-city">CIDADE (OPCIONAL)</label>
                  <input
                    id="create-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: São Paulo"
                    data-testid="create-input-city"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="create-state">ESTADO (OPCIONAL)</label>
                  <input
                    id="create-state"
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Ex: SP"
                    data-testid="create-input-state"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-dark" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-emerald">
              Criar Contato
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
