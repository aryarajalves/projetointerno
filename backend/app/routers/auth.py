import os
import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_jwt_key_12345")
ALGORITHM = "HS256"

router = APIRouter(prefix="/api/auth", tags=["Auth"])

def init_super_admin(db: Session):
    admin_email = os.getenv("SUPER_ADMIN_EMAIL", "aryarajmarketing@gmail.com")
    admin_password = os.getenv("SUPER_ADMIN_PASSWORD", "123456")

    user = db.query(models.User).filter(models.User.email == admin_email).first()
    if not user:
        new_admin = models.User(
            email=admin_email,
            password=admin_password,
            role="SUPER_ADMIN"
        )
        db.add(new_admin)
        db.commit()
        print(f"✅ Super Admin criado com sucesso: {admin_email}")

@router.post(
    "/login", 
    response_model=schemas.LoginResponse,
    summary="Realizar Login no Sistema",
    description="""
    Autentica um usuário existente com **e-mail** e **senha**, retornando o **Token JWT** de acesso e os dados do perfil do usuário.

    🔓 **Autenticação:** Não necessária (Rota Pública).  
    👤 **Permissão:** Qualquer usuário registrado no sistema.
    """
)
def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or user.password != login_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos."
        )

    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    token = jwt.encode(token_payload, JWT_SECRET, algorithm=ALGORITHM)

    return {
        "token": token,
        "user": user
    }
