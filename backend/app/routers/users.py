import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/users", tags=["User Management & Invites"])

@router.get("/", response_model=List[schemas.UserResponse])
def get_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.User).filter(models.User.status == "active")
    
    if search:
        search_pat = f"%{search}%"
        query = query.filter(
            (models.User.email.ilike(search_pat)) | 
            (models.User.name.ilike(search_pat))
        )
    
    if role and role != "Todos":
        query = query.filter(models.User.role == role)

    return query.order_by(models.User.created_at.asc()).all()

@router.post("/invite", response_model=schemas.InviteResponse, status_code=status.HTTP_201_CREATED)
def create_invite(invite_data: schemas.InviteCreate, db: Session = Depends(get_db)):
    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(hours=invite_data.valid_hours)
    client_ids_str = ",".join(map(str, invite_data.allowed_client_ids)) if invite_data.allowed_client_ids else ""

    db_invite = models.Invite(
        token=token,
        role=invite_data.role,
        valid_hours=invite_data.valid_hours,
        allowed_client_ids=client_ids_str,
        expires_at=expires_at,
        used=False
    )
    db.add(db_invite)
    db.commit()
    db.refresh(db_invite)
    return db_invite

@router.get("/invites", response_model=List[schemas.InviteResponse])
def get_invites(db: Session = Depends(get_db)):
    return db.query(models.Invite).order_by(models.Invite.created_at.desc()).all()

@router.get("/invites/{token}", response_model=schemas.InviteResponse)
def get_invite_by_token(token: str, db: Session = Depends(get_db)):
    db_invite = db.query(models.Invite).filter(models.Invite.token == token).first()
    if not db_invite:
        raise HTTPException(status_code=404, detail="Link de convite inválido ou não encontrado.")
    
    if db_invite.used:
        raise HTTPException(status_code=400, detail="Este link de convite já foi utilizado.")
        
    if datetime.utcnow() > db_invite.expires_at:
        raise HTTPException(status_code=400, detail="Este link de convite expirou.")

    return db_invite

@router.post("/invites/{token}/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_via_invite(token: str, req: schemas.InviteRegisterRequest, db: Session = Depends(get_db)):
    db_invite = db.query(models.Invite).filter(models.Invite.token == token).first()
    if not db_invite or db_invite.used or datetime.utcnow() > db_invite.expires_at:
        raise HTTPException(status_code=400, detail="Link de convite inválido ou expirado.")

    existing_user = db.query(models.User).filter(models.User.email == req.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado no sistema.")

    new_user = models.User(
        name=req.name,
        email=req.email,
        password=req.password,
        role=db_invite.role,
        status="active"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Vincular clientes permitidos se houver
    if db_invite.allowed_client_ids:
        c_ids = [int(i) for i in db_invite.allowed_client_ids.split(",") if i.strip()]
        clients = db.query(models.Client).filter(models.Client.id.in_(c_ids)).all()
        new_user.allowed_clients.extend(clients)
        db.commit()

    db_invite.used = True
    db.commit()

    return new_user

@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    if db_user.role == "SUPER_ADMIN":
        raise HTTPException(status_code=400, detail="As informações do Super Admin não podem ser alteradas por esta tela.")

    update_data = user_update.model_dump(exclude_unset=True)
    
    # Atualizar clientes permitidos se enviados
    if "allowed_client_ids" in update_data:
        client_ids = update_data.pop("allowed_client_ids")
        db_user.allowed_clients.clear()
        if client_ids:
            clients = db.query(models.Client).filter(models.Client.id.in_(client_ids)).all()
            db_user.allowed_clients.extend(clients)

    for key, value in update_data.items():
        if value is not None:
            setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
def reset_user_password(user_id: int, pwd_req: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    if db_user.role == "SUPER_ADMIN":
        raise HTTPException(status_code=400, detail="A senha do Super Admin não pode ser resetada por esta tela.")

    db_user.password = pwd_req.new_password
    db.commit()
    return {"detail": "Senha redefinida com sucesso!"}

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    if db_user.role == "SUPER_ADMIN":
        raise HTTPException(status_code=400, detail="O Super Admin não pode ser removido.")

    db_user.status = "inactive"
    db.commit()
    return None
