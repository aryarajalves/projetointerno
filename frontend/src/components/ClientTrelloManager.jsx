import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';

const COLUMNS = [
  { id: 'todo', title: '📝 A Fazer', color: 'var(--text-muted)' },
  { id: 'in_progress', title: '⚡ Em Progresso', color: '#38bdf8' },
  { id: 'done', title: '✅ Concluído', color: 'var(--emerald-primary)' }
];

export function ClientTrelloManager({ clientId, clientName }) {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Paginação independente por coluna (Máximo 5 tarefas por página)
  const [columnPages, setColumnPages] = useState({
    todo: 1,
    in_progress: 1,
    done: 1
  });

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    due_date: ''
  });

  // Subtasks & Attachments State para o Modal
  const [modalSubtasks, setModalSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [modalAttachments, setModalAttachments] = useState([]);
  const [isDescMaximized, setIsDescMaximized] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/clients/${clientId}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Erro ao carregar tarefas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) fetchTasks();
  }, [clientId]);

  // Bloquear a rolagem do fundo (body) quando o popup estiver aberto
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const openCreateModal = (columnId = 'todo') => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      status: columnId,
      due_date: ''
    });
    setModalSubtasks([]);
    setModalAttachments([]);
    setNewSubtaskTitle('');
    setIsDescMaximized(false);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      due_date: task.due_date || ''
    });
    setModalSubtasks(task.subtasks || []);
    setModalAttachments(task.attachments || []);
    setNewSubtaskTitle('');
    setIsDescMaximized(false);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'other';
    const reader = new FileReader();

    reader.onload = async (uploadEvent) => {
      const base64Data = uploadEvent.target.result;

      if (editingTask) {
        try {
          const res = await fetch(`${API_URL}/api/clients/${clientId}/tasks/${editingTask.id}/attachments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file_name: file.name,
              file_type: fileType,
              file_data: base64Data
            })
          });
          if (res.ok) {
            const newAtt = await res.json();
            setModalAttachments(prev => [...prev, newAtt]);
            if (showToast) showToast('Arquivo anexado com sucesso!', 'success');
            fetchTasks();
          }
        } catch (err) {
          alert('Erro ao anexar arquivo.');
        }
      } else {
        setModalAttachments(prev => [...prev, {
          file_name: file.name,
          file_type: fileType,
          file_data: base64Data,
          tempId: Date.now()
        }]);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteAttachmentInModal = async (att) => {
    if (editingTask && att.id) {
      try {
        const res = await fetch(`${API_URL}/api/clients/${clientId}/tasks/${editingTask.id}/attachments/${att.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setModalAttachments(prev => prev.filter(a => a.id !== att.id));
          fetchTasks();
        }
      } catch (err) {
        alert('Erro ao remover anexo.');
      }
    } else {
      setModalAttachments(prev => prev.filter(a => a !== att));
    }
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    const isEdit = !!editingTask;
    const url = isEdit
      ? `${API_URL}/api/clients/${clientId}/tasks/${editingTask.id}`
      : `${API_URL}/api/clients/${clientId}/tasks`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          due_date: formData.due_date ? formData.due_date : null
        })
      });

      if (res.ok) {
        const savedTask = await res.json();

        // Se for nova tarefa e tiver anexos adicionados localmente, salvar agora
        if (!isEdit && modalAttachments.length > 0) {
          for (const att of modalAttachments) {
            await fetch(`${API_URL}/api/clients/${clientId}/tasks/${savedTask.id}/attachments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                file_name: att.file_name,
                file_type: att.file_type,
                file_data: att.file_data
              })
            });
          }
        }

        setIsModalOpen(false);
        setEditingTask(null);
        if (showToast) showToast(`Atividade ${isEdit ? 'atualizada' : 'criada'} com sucesso!`, 'success');
        fetchTasks();
      } else {
        alert('Erro ao salvar atividade.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar atividade.');
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    if (editingTask) {
      // Salva direto no backend se já estiver editando uma tarefa existente
      try {
        const res = await fetch(`${API_URL}/api/clients/${clientId}/tasks/${editingTask.id}/subtasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newSubtaskTitle.trim(), completed: false })
        });
        if (res.ok) {
          const newSub = await res.json();
          setModalSubtasks(prev => [...prev, newSub]);
          setNewSubtaskTitle('');
          fetchTasks();
        }
      } catch (err) {
        alert('Erro ao adicionar subetapa.');
      }
    } else {
      // Adiciona localmente para a nova tarefa
      setModalSubtasks(prev => [...prev, { title: newSubtaskTitle.trim(), completed: false, tempId: Date.now() }]);
      setNewSubtaskTitle('');
    }
  };

  const handleToggleSubtaskInModal = async (sub) => {
    if (editingTask && sub.id) {
      try {
        const res = await fetch(`${API_URL}/api/clients/${clientId}/tasks/${editingTask.id}/subtasks/${sub.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: sub.title, completed: !sub.completed })
        });
        if (res.ok) {
          const updated = await res.json();
          setModalSubtasks(prev => prev.map(s => s.id === sub.id ? updated : s));
          fetchTasks();
        }
      } catch (err) {
        alert('Erro ao atualizar subetapa.');
      }
    } else {
      setModalSubtasks(prev => prev.map(s => (s.id === sub.id || s.tempId === sub.tempId) ? { ...s, completed: !s.completed } : s));
    }
  };

  const handleDeleteSubtaskInModal = async (sub) => {
    if (editingTask && sub.id) {
      try {
        const res = await fetch(`${API_URL}/api/clients/${clientId}/tasks/${editingTask.id}/subtasks/${sub.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setModalSubtasks(prev => prev.filter(s => s.id !== sub.id));
          fetchTasks();
        }
      } catch (err) {
        alert('Erro ao excluir subetapa.');
      }
    } else {
      setModalSubtasks(prev => prev.filter(s => s !== sub));
    }
  };

  const handleToggleSubtaskOnCard = async (task, sub) => {
    const updatedCompleted = !sub.completed;
    // Atualização otimista local para preservar a posição estática do cartão e da sub-etapa
    setTasks(prev => prev.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          subtasks: t.subtasks.map(s => s.id === sub.id ? { ...s, completed: updatedCompleted } : s)
        };
      }
      return t;
    }));

    try {
      await fetch(`${API_URL}/api/clients/${clientId}/tasks/${task.id}/subtasks/${sub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: sub.title, completed: updatedCompleted })
      });
    } catch (err) {
      console.error('Erro ao salvar estado da subetapa:', err);
    }
  };

  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskIdStr) return;

    const taskId = parseInt(taskIdStr, 10);
    const task = tasks.find(t => t.id === taskId);

    if (task && task.status !== targetColumnId) {
      // Atualiza o estado local imediatamente para fluidez visual
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetColumnId } : t));
      setDraggedTaskId(null);
      await handleMoveStatus(task, targetColumnId);
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const res = await fetch(`${API_URL}/api/clients/${clientId}/tasks/${taskToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTaskToDelete(null);
        if (showToast) showToast('Atividade removida.', 'success');
        fetchTasks();
      }
    } catch (err) {
      alert('Erro ao excluir atividade.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* Header do Módulo Trello / Evolução */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📋 Trello & Evolução de Atividades
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Organize ideias, demandas e subetapas para o cliente <strong style={{ color: '#fff' }}>{clientName || ''}</strong>.
          </p>
        </div>
        <button 
          type="button"
          className="btn btn-emerald" 
          onClick={() => openCreateModal('todo')}
          data-testid="add-task-btn"
        >
          + NOVA ATIVIDADE
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Carregando quadro de atividades...</p>
      ) : (
        /* Quadro Kanban de 3 Colunas */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter(t => t.status === col.id);
            const currentPage = columnPages[col.id] || 1;
            const pageSize = 5;
            const totalColPages = Math.max(1, Math.ceil(colTasks.length / pageSize));
            const paginatedTasks = colTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

            return (
              <div 
                key={col.id} 
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                style={{ 
                  background: 'var(--bg-card-inner)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '14px', 
                  padding: '1.25rem',
                  minHeight: '520px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Cabeçalho da Coluna */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: '800', fontSize: '1.05rem', color: col.color, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {col.title}
                  </span>
                  <span style={{ background: 'var(--bg-card)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', color: '#fff', border: '1px solid var(--border-color)' }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Lista de Cartões da Coluna (Máximo 5 de uma vez) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {colTasks.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: '10px' }}>
                      Nenhuma atividade nesta coluna (Arraste um cartão aqui)
                    </div>
                  ) : (
                    paginatedTasks.map((task) => {
                      const completedCount = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
                      const totalSub = task.subtasks ? task.subtasks.length : 0;

                      return (
                        <div 
                          key={task.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          style={{ 
                            background: 'var(--bg-card)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '12px', 
                            padding: '1rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.6rem',
                            cursor: 'grab'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                              {task.title}
                            </span>
                            <div style={{ display: 'flex', gap: '0.2rem' }}>
                              <button 
                                type="button"
                                onClick={() => openEditModal(task)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', opacity: 0.7 }}
                                title="Editar atividade e subetapas"
                              >
                                ✏️
                              </button>
                              <button 
                                type="button"
                                onClick={() => setTaskToDelete(task.id)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', opacity: 0.7 }}
                                title="Excluir atividade"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          {task.description && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', margin: 0, whiteSpace: 'pre-wrap' }}>
                              {task.description}
                            </p>
                          )}

                          {/* Progresso de Subetapas no Cartão com Design Premium */}
                          {totalSub > 0 && (
                            <div style={{ 
                              background: 'var(--bg-card-inner)', 
                              padding: '0.65rem 0.75rem', 
                              borderRadius: '10px', 
                              border: '1px solid var(--border-color)',
                              marginTop: '0.2rem' 
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.5rem' }}>
                                <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>CHECKLIST DE ETAPAS</span>
                                <span style={{ color: completedCount === totalSub ? 'var(--emerald-primary)' : '#38bdf8', fontWeight: '800' }}>
                                  {completedCount}/{totalSub} ({Math.round((completedCount / totalSub) * 100)}%)
                                </span>
                              </div>

                              {/* Barra de Progresso Visual */}
                              <div style={{ width: '100%', height: '4px', background: 'var(--bg-dark)', borderRadius: '2px', overflow: 'hidden', marginBottom: '0.6rem' }}>
                                <div style={{ 
                                  width: `${Math.round((completedCount / totalSub) * 100)}%`, 
                                  height: '100%', 
                                  background: completedCount === totalSub ? 'var(--emerald-primary)' : 'linear-gradient(90deg, #38bdf8, var(--emerald-primary))',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {task.subtasks.map((sub) => (
                                  <label 
                                    key={sub.id} 
                                    style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '0.6rem', 
                                      fontSize: '0.8rem', 
                                      color: sub.completed ? 'var(--text-muted)' : '#ffffff', 
                                      textDecoration: sub.completed ? 'line-through' : 'none', 
                                      cursor: 'pointer',
                                      padding: '0.3rem 0.5rem',
                                      borderRadius: '6px',
                                      background: sub.completed ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                                      border: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}
                                  >
                                    <input 
                                      type="checkbox"
                                      checked={sub.completed}
                                      onChange={() => handleToggleSubtaskOnCard(task, sub)}
                                      style={{ accentColor: 'var(--emerald-primary)', cursor: 'pointer', width: '15px', height: '15px', flexShrink: 0 }}
                                    />
                                    <span style={{ flex: 1, wordBreak: 'break-word' }}>{sub.title}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Data / Prazo de Entrega */}
                          {task.due_date && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--emerald-primary)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.3rem 0.5rem', borderRadius: '6px', width: 'fit-content', border: '1px solid var(--emerald-primary)', fontWeight: '600' }}>
                              📅 Entrega: {formatDate(task.due_date)}
                            </div>
                          )}

                          {/* Botões de movimentação rápida */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)' }}>
                            {task.status !== 'todo' && (
                              <button 
                                type="button"
                                className="btn btn-dark" 
                                onClick={() => handleMoveStatus(task, task.status === 'done' ? 'in_progress' : 'todo')}
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                                title="Mover para esquerda"
                              >
                                ⬅️ Voltar
                              </button>
                            )}
                            {task.status !== 'done' && (
                              <button 
                                type="button"
                                className="btn btn-emerald" 
                                onClick={() => handleMoveStatus(task, task.status === 'todo' ? 'in_progress' : 'done')}
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                                title="Avançar status"
                              >
                                Avançar ➡️
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Paginação da Coluna (Max 5 por vez) */}
                {colTasks.length > 5 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                    <button 
                      type="button"
                      className="btn btn-dark"
                      disabled={currentPage <= 1}
                      onClick={(e) => { e.preventDefault(); setColumnPages(prev => ({ ...prev, [col.id]: Math.max(prev[col.id] - 1, 1) })); }}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                    >
                      &larr; Ant.
                    </button>
                    <span style={{ color: 'var(--text-muted)' }}>Pág. {currentPage} de {totalColPages}</span>
                    <button 
                      type="button"
                      className="btn btn-dark"
                      disabled={currentPage >= totalColPages}
                      onClick={(e) => { e.preventDefault(); setColumnPages(prev => ({ ...prev, [col.id]: Math.min(prev[col.id] + 1, totalColPages) })); }}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                    >
                      Próx. &rarr;
                    </button>
                  </div>
                )}

                {/* Botão rápido no rodapé da coluna */}
                <button 
                  type="button"
                  className="btn btn-dark" 
                  onClick={() => openCreateModal(col.id)}
                  style={{ marginTop: '0.85rem', width: '100%', fontSize: '0.8rem', borderStyle: 'dashed' }}
                >
                  + Adicionar em {col.title.split(' ')[1]}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {taskToDelete && (
        <div className="modal-backdrop" data-testid="delete-task-modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ color: 'var(--badge-red-text)', marginBottom: '0.75rem' }}>Confirmar Exclusão</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Deseja remover esta atividade do quadro Trello?
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-dark" onClick={() => setTaskToDelete(null)}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-dark" 
                onClick={confirmDeleteTask}
                style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Criar ou Editar Tarefa, Subetapas e Anexos */}
      {isModalOpen && (
        <div className="modal-backdrop" data-testid="task-form-modal-backdrop">
          <div className="modal-content" style={{ maxWidth: isDescMaximized ? '720px' : '560px' }}>
            <h2>{editingTask ? 'Editar Atividade & Subetapas' : 'Nova Atividade do Cliente'}</h2>
            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label>TÍTULO DA ATIVIDADE / IDEIA *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Configurar fluxo de automação no ZapVoice"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Descrição com botão de Maximizar */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ margin: 0 }}>DESCRIÇÃO / OBSERVAÇÕES DA DEMANDA</label>
                  <button 
                    type="button" 
                    onClick={() => setIsDescMaximized(!isDescMaximized)}
                    style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700' }}
                  >
                    {isDescMaximized ? '🗗 Reduzir' : '🗖 Maximizar Campo'}
                  </button>
                </div>
                <textarea 
                  rows={isDescMaximized ? 10 : 4}
                  placeholder="Detalhes adicionais sobre a tarefa para alinhamento com o cliente..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', padding: '0.75rem', fontSize: '0.875rem' }}
                />
              </div>

              {/* Seção de Anexos (Imagens, PDF, Arquivos) */}
              <div className="form-group" style={{ background: 'var(--bg-card-inner)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    📎 ANEXOS (IMAGENS, PDF, DOCUMENTOS)
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {modalAttachments.length} arquivo(s)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                  <input 
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="file-upload-input"
                  />
                  <label 
                    htmlFor="file-upload-input"
                    className="btn btn-dark"
                    style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderStyle: 'dashed' }}
                  >
                    📂 Subir Novo Arquivo (Imagem / PDF)
                  </label>
                </div>

                {modalAttachments.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                    {modalAttachments.map((att, index) => (
                      <div 
                        key={att.id || att.tempId || index}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', background: 'var(--bg-dark)', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, overflow: 'hidden' }}>
                          <span style={{ fontSize: '1.1rem' }}>{att.file_type === 'image' ? '🖼️' : '📄'}</span>
                          <span style={{ fontSize: '0.85rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {att.file_name}
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleDeleteAttachmentInModal(att)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', opacity: 0.6 }}
                          title="Remover anexo"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seção de Subetapas no Modal com Layout Alinhado */}
              <div className="form-group" style={{ background: 'var(--bg-card-inner)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--emerald-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    📌 SUBETAPAS / CHECKLIST DA TAREFA
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {modalSubtasks.length} item(ns)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input 
                    type="text"
                    placeholder="Digite uma etapa (ex: Criar banco de dados)..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                    style={{ flex: 1, padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
                  />
                  <button 
                    type="button"
                    className="btn btn-emerald"
                    onClick={handleAddSubtask}
                    style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                  >
                    + Adicionar
                  </button>
                </div>

                {modalSubtasks.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {modalSubtasks.map((sub, index) => (
                      <div 
                        key={sub.id || sub.tempId || index} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justify: 'space-between', 
                          gap: '0.75rem',
                          background: 'var(--bg-card)', 
                          padding: '0.6rem 0.85rem', 
                          borderRadius: '8px', 
                          border: '1px solid var(--border-color)' 
                        }}
                      >
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.75rem', 
                          fontSize: '0.875rem', 
                          color: sub.completed ? 'var(--text-muted)' : '#ffffff', 
                          textDecoration: sub.completed ? 'line-through' : 'none', 
                          cursor: 'pointer', 
                          flex: 1,
                          margin: 0
                        }}>
                          <input 
                            type="checkbox"
                            checked={sub.completed}
                            onChange={() => handleToggleSubtaskInModal(sub)}
                            style={{ accentColor: 'var(--emerald-primary)', cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0 }}
                          />
                          <span style={{ flex: 1, wordBreak: 'break-word', fontWeight: '500' }}>{sub.title}</span>
                        </label>
                        <button 
                          type="button"
                          onClick={() => handleDeleteSubtaskInModal(sub)}
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontSize: '1rem', 
                            opacity: 0.6,
                            padding: '0.2rem',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Remover subetapa"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>COLUNA / STATUS *</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="todo">📝 A Fazer</option>
                  <option value="in_progress">⚡ Em Progresso</option>
                  <option value="done">✅ Concluído</option>
                </select>
              </div>

              <div className="form-group">
                <label>DATA PREVISTA DE ENTREGA / PRAZO</label>
                <input 
                  type="date" 
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-dark" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-emerald">
                  {editingTask ? 'Salvar Alterações' : 'Salvar Atividade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
