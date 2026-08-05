from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/clients", tags=["Tasks / Trello"])

@router.get("/{client_id}/tasks", response_model=List[schemas.TaskResponse])
def get_client_tasks(client_id: int, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Contato não encontrado.")
    return db.query(models.Task).filter(models.Task.client_id == client_id).order_by(models.Task.created_at.asc()).all()

@router.post("/{client_id}/tasks", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_client_task(client_id: int, task: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Contato não encontrado.")
    
    db_task = models.Task(client_id=client_id, **task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.put("/{client_id}/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_client_task(client_id: int, task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.client_id == client_id
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada.")
    
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/{client_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client_task(client_id: int, task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.client_id == client_id
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada.")
    
    db.delete(db_task)
    db.commit()
    return None

# Endpoints de Subetapas / Subtarefas
@router.post("/{client_id}/tasks/{task_id}/subtasks", response_model=schemas.SubtaskResponse, status_code=status.HTTP_201_CREATED)
def create_subtask(client_id: int, task_id: int, subtask: schemas.SubtaskCreate, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.client_id == client_id
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada.")
    
    db_subtask = models.Subtask(task_id=task_id, **subtask.model_dump())
    db.add(db_subtask)
    db.commit()
    db.refresh(db_subtask)
    return db_subtask

@router.put("/{client_id}/tasks/{task_id}/subtasks/{subtask_id}", response_model=schemas.SubtaskResponse)
def toggle_subtask(client_id: int, task_id: int, subtask_id: int, subtask_update: schemas.SubtaskCreate, db: Session = Depends(get_db)):
    db_subtask = db.query(models.Subtask).filter(
        models.Subtask.id == subtask_id,
        models.Subtask.task_id == task_id
    ).first()
    if not db_subtask:
        raise HTTPException(status_code=404, detail="Subetapa não encontrada.")
    
    update_data = subtask_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_subtask, key, value)
        
    db.commit()
    db.refresh(db_subtask)
    return db_subtask

@router.delete("/{client_id}/tasks/{task_id}/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subtask(client_id: int, task_id: int, subtask_id: int, db: Session = Depends(get_db)):
    db_subtask = db.query(models.Subtask).filter(
        models.Subtask.id == subtask_id,
        models.Subtask.task_id == task_id
    ).first()
    if not db_subtask:
        raise HTTPException(status_code=404, detail="Subetapa não encontrada.")
    
    db.delete(db_subtask)
    db.commit()
    return None

# Endpoints de Anexos (Imagens, PDF, Arquivos)
@router.post("/{client_id}/tasks/{task_id}/attachments", response_model=schemas.TaskAttachmentResponse, status_code=status.HTTP_201_CREATED)
def create_attachment(client_id: int, task_id: int, attachment: schemas.TaskAttachmentCreate, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.client_id == client_id
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada.")
    
    db_attachment = models.TaskAttachment(task_id=task_id, **attachment.model_dump())
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment

@router.delete("/{client_id}/tasks/{task_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(client_id: int, task_id: int, attachment_id: int, db: Session = Depends(get_db)):
    db_attachment = db.query(models.TaskAttachment).filter(
        models.TaskAttachment.id == attachment_id,
        models.TaskAttachment.task_id == task_id
    ).first()
    if not db_attachment:
        raise HTTPException(status_code=404, detail="Anexo não encontrado.")
    
    db.delete(db_attachment)
    db.commit()
    return None
