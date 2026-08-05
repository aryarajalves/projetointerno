from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/tickets", tags=["Support Tickets"])

def build_ticket_response(ticket: models.SupportTicket) -> schemas.SupportTicketResponse:
    res = schemas.SupportTicketResponse.model_validate(ticket)
    res.client_name = ticket.client.name if ticket.client else "Cliente Removido"
    if ticket.creator:
        res.created_by_name = ticket.creator.name or ticket.creator.email
    else:
        res.created_by_name = "Super Admin"
    return res

@router.get(
    "/", 
    response_model=List[schemas.SupportTicketResponse],
    summary="Listar Tickets de Suporte",
    description="""
    Retorna a lista de tickets de suporte cadastrados com filtros por cliente, status (open, in_progress, resolved, closed), tipo (bug, feature, task), aplicação e busca.

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** Qualquer usuário autenticado (**SUPER_ADMIN**, **ADMIN**, **USER**).
    """
)
def get_tickets(
    client_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    type_filter: Optional[str] = Query(None),
    app_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.SupportTicket).order_by(desc(models.SupportTicket.created_at))

    if client_id:
        query = query.filter(models.SupportTicket.client_id == client_id)
    if status_filter and status_filter.lower() != "todos":
        query = query.filter(models.SupportTicket.status == status_filter)
    if type_filter and type_filter.lower() != "todos":
        query = query.filter(models.SupportTicket.ticket_type == type_filter)
    if app_name and app_name.lower() != "todos":
        query = query.filter(models.SupportTicket.app_name == app_name)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (models.SupportTicket.title.ilike(search_pattern)) |
            (models.SupportTicket.description.ilike(search_pattern))
        )

    tickets = query.all()
    return [build_ticket_response(t) for t in tickets]

@router.post(
    "/", 
    response_model=schemas.SupportTicketResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Abrir Novo Ticket de Suporte",
    description="""
    Abre um novo chamando de suporte vinculado a um cliente e uma aplicação (AgentFlow, ZapJords, Oraculo, ZapGroup, Outros).

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** Qualquer usuário autenticado (**SUPER_ADMIN**, **ADMIN**, **USER**).
    """
)
def create_ticket(ticket_data: schemas.SupportTicketCreate, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == ticket_data.client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    ticket_dict = ticket_data.model_dump()
    attachments_data = ticket_dict.pop("attachments", [])

    db_ticket = models.SupportTicket(**ticket_dict)
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)

    for att in attachments_data:
        db_att = models.TicketAttachment(ticket_id=db_ticket.id, **att)
        db.add(db_att)

    if attachments_data:
        db.commit()
        db.refresh(db_ticket)

    return build_ticket_response(db_ticket)

@router.get(
    "/{ticket_id}", 
    response_model=schemas.SupportTicketResponse,
    summary="Obter Detalhes de um Ticket",
    description="""
    Retorna as informações completas de um ticket de suporte pelo ID.

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** Qualquer usuário autenticado.
    """
)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    db_ticket = db.query(models.SupportTicket).filter(models.SupportTicket.id == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado.")

    return build_ticket_response(db_ticket)

@router.put(
    "/{ticket_id}", 
    response_model=schemas.SupportTicketResponse,
    summary="Atualizar Ticket de Suporte",
    description="""
    Atualiza status (ex: resolved, in_progress, closed), prioridade, título, descrição ou data limite de resolução do ticket.

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** **SUPER_ADMIN** e **ADMIN**.
    """
)
def update_ticket(ticket_id: int, update_data: schemas.SupportTicketUpdate, db: Session = Depends(get_db)):
    db_ticket = db.query(models.SupportTicket).filter(models.SupportTicket.id == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado.")

    data = update_data.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(db_ticket, key, value)

    db.commit()
    db.refresh(db_ticket)

    return build_ticket_response(db_ticket)

@router.delete(
    "/{ticket_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir Ticket de Suporte",
    description="""
    Remove permanentemente um ticket de suporte do sistema.

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** **SUPER_ADMIN** e **ADMIN**.
    """
)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    db_ticket = db.query(models.SupportTicket).filter(models.SupportTicket.id == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado.")

    db.delete(db_ticket)
    db.commit()
    return None
