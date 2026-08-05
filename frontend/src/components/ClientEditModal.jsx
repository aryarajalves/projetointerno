import React, { useState, useEffect, useRef } from 'react';

export function ClientEditModal({ isOpen, client, onClose, onSave, currentUser }) {
  if (!isOpen || !client) return null;

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState('basic');
  const [isNotesMaximized, setIsNotesMaximized] = useState(false);

  const [name, setName] = useState(client.name || '');
  const [type, setType] = useState(client.type || 'Lead');
  const [notes, setNotes] = useState(client.notes || '');

  // Campos opcionais adicionais do contato
  const [email, setEmail] = useState(client.email || '');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState(client.phone_whatsapp || '');
  const [instagram, setInstagram] = useState(client.instagram || '');
  const [address, setAddress] = useState(client.address || '');
  const [city, setCity] = useState(client.city || '');
  const [state, setState] = useState(client.state || '');

  const [serverIp, setServerIp] = useState(client.server_ip || '');
  const [serverPassword, setServerPassword] = useState(client.server_password || '');
  const [showPassword, setShowPassword] = useState(false);

  // Portainer General States
  const [portainerUrl, setPortainerUrl] = useState(client.portainer_url || '');
  const [portainerUsername, setPortainerUsername] = useState(client.portainer_username || '');
  const [portainerPassword, setPortainerPassword] = useState(client.portainer_password || '');
  const [showPortainerPassword, setShowPortainerPassword] = useState(false);

  // Per-App Stacks & Services
  const [agentflowStackName, setAgentflowStackName] = useState(client.agentflow_stack_name || '');
  const [agentflowServiceName, setAgentflowServiceName] = useState(client.agentflow_service_name || '');

  const [zapjordsStackName, setZapjordsStackName] = useState(client.zapjords_stack_name || '');
  const [zapjordsServiceName, setZapjordsServiceName] = useState(client.zapjords_service_name || '');

  const [oraculoStackName, setOraculoStackName] = useState(client.oraculo_stack_name || '');
  const [oraculoServiceName, setOraculoServiceName] = useState(client.oraculo_service_name || '');

  const [zapgroupStackName, setZapgroupStackName] = useState(client.zapgroup_stack_name || '');
  const [zapgroupServiceName, setZapgroupServiceName] = useState(client.zapgroup_service_name || '');

  // Attachments State
  const [attachments, setAttachments] = useState(client.attachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const textFileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && client.id) {
      setName(client.name || '');
      setType(client.type || 'Lead');
      setNotes(client.notes || '');
      setEmail(client.email || '');
      setPhoneWhatsapp(client.phone_whatsapp || '');
      setInstagram(client.instagram || '');
      setAddress(client.address || '');
      setCity(client.city || '');
      setState(client.state || '');
      setServerIp(client.server_ip || '');
      setServerPassword(client.server_password || '');
      setPortainerUrl(client.portainer_url || '');
      setPortainerUsername(client.portainer_username || '');
      setPortainerPassword(client.portainer_password || '');
      setAgentflowStackName(client.agentflow_stack_name || '');
      setAgentflowServiceName(client.agentflow_service_name || '');
      setZapjordsStackName(client.zapjords_stack_name || '');
      setZapjordsServiceName(client.zapjords_service_name || '');
      setOraculoStackName(client.oraculo_stack_name || '');
      setOraculoServiceName(client.oraculo_service_name || '');
      setZapgroupStackName(client.zapgroup_stack_name || '');
      setZapgroupServiceName(client.zapgroup_service_name || '');

      fetch(`/api/clients/${client.id}/attachments`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setAttachments(data))
        .catch(() => setAttachments(client.attachments || []));
    }
  }, [isOpen, client]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const fileData = event.target.result;
      const payload = {
        file_name: file.name,
        file_type: file.type || 'document',
        file_data: fileData
      };

      try {
        const res = await fetch(`/api/clients/${client.id}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const newAtt = await res.json();
          setAttachments(prev => [...prev, newAtt]);

          // Se for arquivo de texto, importar para o textarea de notas se desejado
          if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            const textReader = new FileReader();
            textReader.onload = (txtEvent) => {
              const textContent = txtEvent.target.result;
              if (window.confirm(`Deseja também anexar o conteúdo do arquivo "${file.name}" diretamente nas Notas?`)) {
                setNotes(prev => prev ? `${prev}\n\n--- [Transcrição / ${file.name}] ---\n${textContent}` : textContent);
              }
            };
            textReader.readAsText(file);
          }
        } else {
          alert('Erro ao enviar arquivo.');
        }
      } catch (err) {
        console.error(err);
        alert('Falha de conexão ao enviar anexo.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const handleImportTextFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (txtEvent) => {
      const textContent = txtEvent.target.result;
      setNotes(prev => prev ? `${prev}\n\n--- [Importado: ${file.name}] ---\n${textContent}` : textContent);
    };
    reader.readAsText(file);
    if (textFileInputRef.current) textFileInputRef.current.value = '';
  };

  const handleDeleteAttachment = async (attId) => {
    if (!window.confirm('Deseja realmente excluir este anexo?')) return;
    try {
      const res = await fetch(`/api/clients/${client.id}/attachments/${attId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAttachments(prev => prev.filter(a => a.id !== attId));
      } else {
        alert('Erro ao excluir anexo.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(notes);
    alert('Notas copiadas para a área de transferência!');
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return '📄';
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return '📕 PDF';
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) return '📘 DOC';
    if (lower.endsWith('.txt') || lower.endsWith('.md')) return '📝 TXT';
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return '🖼️ IMG';
    if (lower.endsWith('.zip') || lower.endsWith('.rar')) return '📦 ZIP';
    return '📄 DOC';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name,
      type,
      notes,
      email: email || null,
      phone_whatsapp: phoneWhatsapp || null,
      instagram: instagram || null,
      address: address || null,
      city: city || null,
      state: state || null
    };
    if (isSuperAdmin) {
      payload.server_ip = serverIp;
      payload.server_password = serverPassword;
      payload.portainer_url = portainerUrl;
      payload.portainer_username = portainerUsername;
      payload.portainer_password = portainerPassword;

      payload.agentflow_stack_name = agentflowStackName;
      payload.agentflow_service_name = agentflowServiceName;

      payload.zapjords_stack_name = zapjordsStackName;
      payload.zapjords_service_name = zapjordsServiceName;

      payload.oraculo_stack_name = oraculoStackName;
      payload.oraculo_service_name = oraculoServiceName;

      payload.zapgroup_stack_name = zapgroupStackName;
      payload.zapgroup_service_name = zapgroupServiceName;
    }
    onSave(client.id, payload);
    onClose();
  };

  const appList = [
    { key: 'agentflow', name: 'AgentFlow', icon: '🤖', stackState: agentflowStackName, setStack: setAgentflowStackName, serviceState: agentflowServiceName, setService: setAgentflowServiceName },
    { key: 'zapjords', name: 'ZapJords', icon: '⚡', stackState: zapjordsStackName, setStack: setZapjordsStackName, serviceState: zapjordsServiceName, setService: setZapjordsServiceName },
    { key: 'oraculo', name: 'Oráculo', icon: '🔮', stackState: oraculoStackName, setStack: setOraculoStackName, serviceState: oraculoServiceName, setService: setOraculoServiceName },
    { key: 'zapgroup', name: 'ZapGroup', icon: '👥', stackState: zapgroupStackName, setStack: setZapgroupStackName, serviceState: zapgroupServiceName, setService: setZapgroupServiceName }
  ];

  return (
    <div className="modal-backdrop" data-testid="edit-modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '740px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '1.25rem' }}>Editar Contato</h2>

        {/* NAVEGAÇÃO DE ABAS DO MODAL (GRID EM 1 ÚNICA LINHA) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isSuperAdmin ? 'repeat(4, 1fr)' : '1fr',
          gap: '0.4rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            style={{
              padding: '0.55rem 0.2rem',
              borderRadius: '8px',
              border: activeTab === 'basic' ? '1px solid var(--emerald-primary)' : '1px solid var(--border-color)',
              background: activeTab === 'basic' ? 'var(--emerald-primary)' : 'var(--bg-card-inner)',
              color: activeTab === 'basic' ? '#000' : 'var(--text-muted)',
              fontWeight: activeTab === 'basic' ? '800' : '600',
              cursor: 'pointer',
              fontSize: '0.78rem',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transition: 'all 0.15s ease'
            }}
            data-testid="modal-tab-basic"
            title="Dados & Notas"
          >
            👤 Dados & Notas
          </button>

          {isSuperAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('server')}
                style={{
                  padding: '0.55rem 0.2rem',
                  borderRadius: '8px',
                  border: activeTab === 'server' ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  background: activeTab === 'server' ? '#ef4444' : 'var(--bg-card-inner)',
                  color: activeTab === 'server' ? '#fff' : 'var(--text-muted)',
                  fontWeight: activeTab === 'server' ? '800' : '600',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  transition: 'all 0.15s ease'
                }}
                data-testid="modal-tab-server"
                title="Servidor SSH"
              >
                🔐 Servidor SSH
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('portainer')}
                style={{
                  padding: '0.55rem 0.2rem',
                  borderRadius: '8px',
                  border: activeTab === 'portainer' ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                  background: activeTab === 'portainer' ? '#3b82f6' : 'var(--bg-card-inner)',
                  color: activeTab === 'portainer' ? '#fff' : 'var(--text-muted)',
                  fontWeight: activeTab === 'portainer' ? '800' : '600',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  transition: 'all 0.15s ease'
                }}
                data-testid="modal-tab-portainer"
                title="Portainer API"
              >
                🐳 Portainer API
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stacks')}
                style={{
                  padding: '0.55rem 0.2rem',
                  borderRadius: '8px',
                  border: activeTab === 'stacks' ? '1px solid #8b5cf6' : '1px solid var(--border-color)',
                  background: activeTab === 'stacks' ? '#8b5cf6' : 'var(--bg-card-inner)',
                  color: activeTab === 'stacks' ? '#fff' : 'var(--text-muted)',
                  fontWeight: activeTab === 'stacks' ? '800' : '600',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  transition: 'all 0.15s ease'
                }}
                data-testid="modal-tab-stacks"
                title="Stacks & Serviços"
              >
                🚀 Stacks & Serviços
              </button>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} data-testid="edit-client-form" autoComplete="off">
          {/* ABA 1: DADOS BÁSICOS & NOTAS */}
          {(activeTab === 'basic' || !isSuperAdmin) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="edit-name">NOME DO CONTATO *</label>
                  <input
                    id="edit-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-type">TIPO DE CONTATO *</label>
                  <select
                    id="edit-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="Lead">🎯 Lead (Prospecção)</option>
                    <option value="Cliente">✅ Cliente (Ativo)</option>
                  </select>
                </div>
              </div>

              {/* SEÇÃO: CONTATO & REDES SOCIAIS */}
              <div style={{ background: 'var(--bg-card-inner)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  📱 Contato & Redes Sociais (Opcionais)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label htmlFor="edit-email">E-MAIL</label>
                    <input
                      id="edit-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@empresa.com"
                      data-testid="edit-input-email"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-phone">WHATSAPP / FONE</label>
                    <input
                      id="edit-phone"
                      type="text"
                      value={phoneWhatsapp}
                      onChange={(e) => setPhoneWhatsapp(e.target.value)}
                      placeholder="(11) 99999-9999"
                      data-testid="edit-input-phone"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-instagram">INSTAGRAM</label>
                    <input
                      id="edit-instagram"
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@usuario"
                      data-testid="edit-input-instagram"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO: ENDEREÇO & LOCALIZAÇÃO */}
              <div style={{ background: 'var(--bg-card-inner)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  📍 Endereço & Localização (Opcionais)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label htmlFor="edit-address">ENDEREÇO COMPLETO</label>
                    <input
                      id="edit-address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rua, Número, Bairro"
                      data-testid="edit-input-address"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-city">CIDADE</label>
                    <input
                      id="edit-city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="São Paulo"
                      data-testid="edit-input-city"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-state">ESTADO</label>
                    <input
                      id="edit-state"
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="SP"
                      data-testid="edit-input-state"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO DE NOTAS COM BOTOES DE CONTROLE E MAXIMIZAR */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label htmlFor="edit-notes" style={{ marginBottom: 0 }}>
                    NOTAS / OBSERVAÇÕES / TRANSCRIÇÕES
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => textFileInputRef.current?.click()}
                      style={{
                        background: 'var(--bg-card-inner)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-muted)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                      title="Importar texto de arquivo TXT ou Markdown"
                      data-testid="import-text-file-btn"
                    >
                      📄 Importar TXT
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNotesMaximized(true)}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid var(--emerald-primary)',
                        color: 'var(--emerald-primary)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                      title="Maximizar tela de notas"
                      data-testid="maximize-notes-btn"
                    >
                      🗖 Maximizar
                    </button>
                  </div>
                </div>

                <input 
                  type="file" 
                  ref={textFileInputRef} 
                  onChange={handleImportTextFile} 
                  accept=".txt,.md,.json,.log" 
                  style={{ display: 'none' }} 
                />

                <textarea
                  id="edit-notes"
                  rows="4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escreva notas, observações, orientações ou cole a transcrição completa de aulas/reuniões..."
                  style={{ width: '100%', resize: 'vertical' }}
                ></textarea>
              </div>

              {/* SEÇÃO DE DOCUMENTOS & ANEXOS */}
              <div style={{
                background: 'var(--bg-card-inner)',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#fff', textTransform: 'uppercase', marginBottom: 0 }}>
                    📎 Documentos & Anexos (PDF, Transcrições, Docs)
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid #3b82f6',
                      color: '#60a5fa',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                    data-testid="add-attachment-btn"
                  >
                    {isUploading ? '⏳ Enviando...' : '📁 + Subir Documento / PDF'}
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.zip,.rar"
                  style={{ display: 'none' }}
                />

                {attachments.length === 0 ? (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                    Nenhum documento anexado ainda. Suba PDFs, transcrições de aulas ou arquivos de documentação.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {attachments.map(att => (
                      <div 
                        key={att.id} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255, 255, 255, 0.03)',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                          <span style={{ fontSize: '0.85rem' }}>{getFileIcon(att.file_name)}</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                            {att.file_name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <a
                            href={att.file_data}
                            download={att.file_name}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: '#38bdf8',
                              fontSize: '0.72rem',
                              textDecoration: 'none',
                              padding: '0.15rem 0.45rem',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              borderRadius: '4px',
                              fontWeight: '700'
                            }}
                          >
                            ⏬ Baixar
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              borderRadius: '4px',
                              padding: '0.15rem 0.45rem',
                              fontSize: '0.72rem',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 2: INFORMAÇÕES DO SERVIDOR SSH */}
          {activeTab === 'server' && isSuperAdmin && (
            <div style={{
              padding: '1.25rem',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🔐 Informações do Servidor (SSH / Acesso Direto)
                </span>
                <span style={{ fontSize: '0.65rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '4px', padding: '0.1rem 0.4rem', fontWeight: '700' }}>
                  SUPER ADMIN
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="edit-server-ip" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🌐 IP DO SERVIDOR
                </label>
                <input
                  id="edit-server-ip"
                  name="client_server_ip_field"
                  type="text"
                  placeholder="ex: 192.168.1.100 ou 123.45.67.89"
                  value={serverIp}
                  onChange={(e) => setServerIp(e.target.value)}
                  autoComplete="off"
                  data-testid="edit-server-ip-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="edit-server-password" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🔑 SENHA DO SERVIDOR
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="edit-server-password"
                    name="client_server_pwd_field"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha do servidor..."
                    value={serverPassword}
                    onChange={(e) => setServerPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{ paddingRight: '3rem' }}
                    data-testid="edit-server-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{
                      position: 'absolute',
                      right: '0.6rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '0.2rem'
                    }}
                    title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: CREDENCIAIS DO PORTAINER API */}
          {activeTab === 'portainer' && isSuperAdmin && (
            <div style={{
              padding: '1.25rem',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🐳 Acesso ao Portainer (API & Automação)
                </span>
                <span style={{ fontSize: '0.65rem', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '4px', padding: '0.1rem 0.4rem', fontWeight: '700' }}>
                  PORTAINER API
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🔗 URL DO PORTAINER
                </label>
                <input
                  name="portainer_url_field"
                  type="text"
                  placeholder="https://seu-portainer.com:9443"
                  value={portainerUrl}
                  onChange={(e) => setPortainerUrl(e.target.value)}
                  autoComplete="off"
                  data-testid="edit-portainer-url-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>👤 USUÁRIO PORTAINER</label>
                  <input
                    name="portainer_user_field"
                    type="text"
                    placeholder="admin"
                    value={portainerUsername}
                    onChange={(e) => setPortainerUsername(e.target.value)}
                    autoComplete="off"
                    data-testid="edit-portainer-username-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>🔑 SENHA PORTAINER</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      name="portainer_pwd_field"
                      type={showPortainerPassword ? 'text' : 'password'}
                      placeholder="Senha..."
                      value={portainerPassword}
                      onChange={(e) => setPortainerPassword(e.target.value)}
                      autoComplete="new-password"
                      style={{ paddingRight: '2.5rem' }}
                      data-testid="edit-portainer-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPortainerPassword(p => !p)}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      {showPortainerPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: STACKS E SERVIÇOS */}
          {activeTab === 'stacks' && isSuperAdmin && (
            <div style={{
              padding: '1.25rem',
              background: 'rgba(139, 92, 246, 0.05)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: '12px'
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#8b5cf6', textTransform: 'uppercase', display: 'block', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                🚀 Stacks & Serviços por Aplicação
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {appList.map(app => (
                  <div key={app.key} style={{ background: 'var(--bg-card-inner)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{app.icon}</span> <span>{app.name}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.68rem' }}>NOME DA STACK</label>
                        <input
                          type="text"
                          placeholder={`ex: ${app.key}-stack`}
                          value={app.stackState}
                          onChange={(e) => app.setStack(e.target.value)}
                          style={{ fontSize: '0.82rem', padding: '0.45rem' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.68rem' }}>SERVIÇO(S) (SEPARE POR VÍRGULA)</label>
                        <input
                          type="text"
                          placeholder="ex: app, worker, api"
                          value={app.serviceState}
                          onChange={(e) => app.setService(e.target.value)}
                          style={{ fontSize: '0.82rem', padding: '0.45rem' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-dark" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-emerald">
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>

      {/* MODAL EXPANDIDO / MAXIMIZADO PARA NOTAS */}
      {isNotesMaximized && (
        <div 
          className="modal-backdrop" 
          style={{ zIndex: 1100, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(6px)' }}
          data-testid="maximized-notes-modal"
        >
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: '92vw', 
              width: '1000px', 
              height: '88vh', 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '1.5rem',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)',
              border: '1px solid var(--emerald-primary)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📝 Editor de Notas, Transcrições & Documentos</span>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    MODO EXPANDIDO
                  </span>
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                  📊 Estatísticas: {notes.length} caracteres | {notes.trim() ? notes.trim().split(/\s+/).length : 0} palavras | {notes ? notes.split('\n').length : 0} linhas
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleCopyNotes}
                  className="btn btn-dark"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  📋 Copiar Texto
                </button>
                <button
                  type="button"
                  onClick={() => setNotes('')}
                  className="btn btn-dark"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', color: '#ef4444' }}
                >
                  🧹 Limpar
                </button>
                <button
                  type="button"
                  onClick={() => setIsNotesMaximized(false)}
                  className="btn btn-emerald"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                  data-testid="close-maximized-notes-btn"
                >
                  🗗 Concluir / Reduzir
                </button>
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cole aqui a transcrição completa de aulas, reuniões, prompts ou anotações detalhadas..."
              style={{
                flex: 1,
                width: '100%',
                background: 'var(--bg-card-inner)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: '#fff',
                padding: '1.25rem',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                fontFamily: 'monospace, sans-serif',
                resize: 'none',
                outline: 'none'
              }}
              data-testid="maximized-notes-textarea"
            ></textarea>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsNotesMaximized(false)}
                className="btn btn-emerald"
              >
                Salvar Alterações de Notas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
