from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/clients", tags=["Credentials"])

@router.get("/{client_id}/credentials", response_model=schemas.CredentialListResponse)
def get_credentials(
    client_id: int, 
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    user_role: Optional[str] = Header(None, alias="X-User-Role"),
    db: Session = Depends(get_db)
):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Contato não encontrado.")
    
    query = db.query(models.Credential).filter(models.Credential.client_id == client_id)

    if user_role and user_role != "SUPER_ADMIN":
        query = query.filter(models.Credential.is_superadmin_only == False)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (models.Credential.title.ilike(search_pattern)) |
            (models.Credential.username.ilike(search_pattern)) |
            (models.Credential.access_url.ilike(search_pattern))
        )

    total = query.count()
    skip = (page - 1) * limit
    credentials = query.order_by(models.Credential.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "items": credentials,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1
    }

@router.post("/{client_id}/credentials", response_model=schemas.CredentialResponse, status_code=status.HTTP_201_CREATED)
def create_credential(client_id: int, credential: schemas.CredentialCreate, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Contato não encontrado.")
    
    db_credential = models.Credential(client_id=client_id, **credential.model_dump())
    db.add(db_credential)
    db.commit()
    db.refresh(db_credential)
    return db_credential

@router.put("/{client_id}/credentials/{credential_id}", response_model=schemas.CredentialResponse)
def update_credential(client_id: int, credential_id: int, credential_update: schemas.CredentialCreate, db: Session = Depends(get_db)):
    db_cred = db.query(models.Credential).filter(
        models.Credential.id == credential_id,
        models.Credential.client_id == client_id
    ).first()
    if not db_cred:
        raise HTTPException(status_code=404, detail="Credencial não encontrada.")
    
    update_data = credential_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_cred, key, value)
        
    db.commit()
    db.refresh(db_cred)
    return db_cred

@router.delete("/{client_id}/credentials/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_credential(client_id: int, credential_id: int, db: Session = Depends(get_db)):
    db_cred = db.query(models.Credential).filter(
        models.Credential.id == credential_id,
        models.Credential.client_id == client_id
    ).first()
    if not db_cred:
        raise HTTPException(status_code=404, detail="Credencial não encontrada.")
    
    db.delete(db_cred)
    db.commit()
    return None
