from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import cast, Date, asc, desc
from typing import List, Optional
from datetime import date

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/clients", tags=["Clients"])

@router.get(
    "/", 
    response_model=schemas.ClientListResponse,
    summary="Listar Contatos / Clientes",
    description="""
    Retorna a lista paginada de contatos e leads cadastrados no sistema com suporte a múltiplos filtros (busca por nome, tipo Lead/Cliente, credenciais salvas, demandas Trello, tickets de suporte, servidor Portainer e ordenação).

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** **SUPER_ADMIN**, **ADMIN** e **USER** (usuários USER visualizam apenas os clientes expressamente autorizados).
    """
)
def get_clients(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    search: Optional[str] = None,
    created_date: Optional[str] = None,
    contact_type: Optional[str] = Query(None, description="Lead, Cliente ou Todos"),
    has_credentials: Optional[bool] = Query(None, description="Filtrar por contatos com credenciais salvas"),
    has_tickets: Optional[bool] = Query(None, description="Filtrar por contatos com tickets de suporte criados"),
    has_tasks: Optional[bool] = Query(None, description="Filtrar por contatos com demandas no Trello criadas"),
    has_portainer: Optional[bool] = Query(None, description="Filtrar por contatos com Portainer configurado"),
    order_by: Optional[str] = Query("name_asc", description="name_asc, name_desc, date_desc, date_asc"),
    user_id: Optional[int] = Query(None, description="ID do usuário logado para restrição de clientes permitidos"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Client)

    # Restrição por Usuário (se o cargo for USER, filtra apenas pelos clientes autorizados em user.allowed_clients)
    if user_id:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user and user.role == "USER":
            allowed_ids = [c.id for c in user.allowed_clients]
            query = query.filter(models.Client.id.in_(allowed_ids))

    # Filtro por Tipo (Lead ou Cliente)
    if contact_type and contact_type.lower() != "todos":
        query = query.filter(models.Client.type.ilike(contact_type))

    # Filtro de Contatos com Senha/Credencial Salva
    if has_credentials is True:
        query = query.filter(models.Client.credentials.any())

    # Filtro de Contatos com Tickets de Suporte Criados
    if has_tickets is True:
        query = query.filter(models.Client.tickets.any())

    # Filtro de Contatos com Demanda no Trello Criada
    if has_tasks is True:
        query = query.filter(models.Client.tasks.any())

    # Filtro por Portainer Configurado
    if has_portainer is True:
        query = query.filter(models.Client.portainer_url.isnot(None), models.Client.portainer_url != "")
    elif has_portainer is False:
        query = query.filter((models.Client.portainer_url.is_(None)) | (models.Client.portainer_url == ""))

    # Filtro por Nome ou Observação
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (models.Client.name.ilike(search_pattern)) | 
            (models.Client.notes.ilike(search_pattern))
        )

    # Filtro por Data de Criação Exata
    if created_date:
        try:
            target_date = date.fromisoformat(created_date)
            query = query.filter(cast(models.Client.created_at, Date) == target_date)
        except ValueError:
            pass

    # Ordenação dos resultados
    if order_by == "name_desc":
        query = query.order_by(models.Client.is_pinned.desc(), desc(models.Client.name))
    elif order_by == "date_desc":
        query = query.order_by(models.Client.is_pinned.desc(), desc(models.Client.created_at))
    elif order_by == "date_asc":
        query = query.order_by(models.Client.is_pinned.desc(), asc(models.Client.created_at))
    else: # name_asc (padrão)
        query = query.order_by(models.Client.is_pinned.desc(), asc(models.Client.name))

    total = query.count()
    offset = (page - 1) * limit
    clients = query.offset(offset).limit(limit).all()

    return {
        "items": clients,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1
    }

@router.post(
    "/", 
    response_model=schemas.ClientResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar Novo Contato",
    description="""
    Cria um novo registro de contato (Lead ou Cliente) no sistema.

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** **SUPER_ADMIN** e **ADMIN**.
    """
)
def create_client(client: schemas.ClientCreate, db: Session = Depends(get_db)):
    db_client = models.Client(**client.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@router.post(
    "/{client_id}/pin", 
    response_model=schemas.ClientResponse,
    summary="Fixar / Desfixar Contato",
    description="""
    Alterna o status de fixado (is_pinned) de um contato. É permitido fixar no máximo 10 contatos no topo da lista.

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** Qualquer usuário autenticado (**SUPER_ADMIN**, **ADMIN**, **USER**).
    """
)
def toggle_pin_client(client_id: int, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contato não encontrado."
        )

    # Se estiver tentando fixar (is_pinned -> True), verifica o limite de 10
    if not db_client.is_pinned:
        pinned_count = db.query(models.Client).filter(models.Client.is_pinned == True).count()
        if pinned_count >= 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limite máximo de 10 contatos fixados atingido. Desfixe um contato antes de fixar outro."
            )
        db_client.is_pinned = True
    else:
        db_client.is_pinned = False

    db.commit()
    db.refresh(db_client)
    return db_client

@router.get(
    "/{client_id}", 
    response_model=schemas.ClientResponse,
    summary="Obter Detalhes de um Contato",
    description="""
    Retorna as informações completas de um contato específico pelo ID.

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** Qualquer usuário autenticado com acesso ao cliente.
    """
)
def get_client(client_id: int, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contato não encontrado."
        )
    return db_client

@router.put(
    "/{client_id}", 
    response_model=schemas.ClientResponse,
    summary="Atualizar Contato",
    description="""
    Atualiza dados de um contato existente (nome, tipo, observações, dados de servidor, etc.).

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** **SUPER_ADMIN** e **ADMIN**.
    """
)
def update_client(client_id: int, client_update: schemas.ClientUpdate, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contato não encontrado."
        )
    
    update_data = client_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_client, key, value)
        
    db.commit()
    db.refresh(db_client)
    return db_client

@router.delete(
    "/{client_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir Contato",
    description="""
    Remove permanentemente um contato e seus registros vinculados.

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** Exclusivo para **SUPER_ADMIN** e **ADMIN**.
    """
)
def delete_client(client_id: int, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contato não encontrado."
        )
    db.delete(db_client)
    db.commit()
    return None

# Endpoints de Anexos / Documentos do Contato
@router.get(
    "/{client_id}/attachments", 
    response_model=List[schemas.ClientAttachmentResponse],
    summary="Listar Anexos do Contato",
    description="""
    Retorna a lista de documentos e arquivos anexados ao contato.

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** Usuários autenticados com acesso ao cliente.
    """
)
def get_client_attachments(client_id: int, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Contato não encontrado.")
    return db.query(models.ClientAttachment).filter(models.ClientAttachment.client_id == client_id).all()

@router.post(
    "/{client_id}/attachments", 
    response_model=schemas.ClientAttachmentResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Adicionar Anexo ao Contato",
    description="""
    Envia e anexa um novo arquivo ao cadastro do contato.

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** **SUPER_ADMIN** e **ADMIN**.
    """
)
def create_client_attachment(client_id: int, attachment_data: schemas.ClientAttachmentCreate, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Contato não encontrado.")
    
    db_attachment = models.ClientAttachment(
        client_id=client_id,
        file_name=attachment_data.file_name,
        file_type=attachment_data.file_type,
        file_data=attachment_data.file_data
    )
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment

@router.delete(
    "/{client_id}/attachments/{attachment_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover Anexo do Contato",
    description="""
    Exclui um documento anexado ao contato.

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** **SUPER_ADMIN** e **ADMIN**.
    """
)
def delete_client_attachment(client_id: int, attachment_id: int, db: Session = Depends(get_db)):
    attachment = db.query(models.ClientAttachment).filter(
        models.ClientAttachment.id == attachment_id,
        models.ClientAttachment.client_id == client_id
    ).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Anexo não encontrado.")
    db.delete(attachment)
    db.commit()
    return None
