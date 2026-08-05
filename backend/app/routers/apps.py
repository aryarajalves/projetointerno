from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/clients", tags=["Purchased Apps"])

@router.get(
    "/{client_id}/apps", 
    response_model=List[schemas.PurchasedAppResponse],
    summary="Listar Aplicações Contratadas de um Contato",
    description="""
    Retorna a lista de aplicações e ferramentas contratadas por um cliente específico, com os respectivos parcelamentos e valores.

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** **SUPER_ADMIN** e **ADMIN**.
    """
)
def get_client_apps(client_id: int, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Contato não encontrado.")
    return db.query(models.PurchasedApp).filter(models.PurchasedApp.client_id == client_id).all()

@router.post(
    "/{client_id}/apps", 
    response_model=schemas.PurchasedAppResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Registrar / Atualizar Compra de Aplicação",
    description="""
    Registra a contratação de uma aplicação para o cliente ou atualiza as condições de pagamento (parcelamento, valores e data de renovação).

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** **SUPER_ADMIN** e **ADMIN**.
    """
)
def create_purchased_app(client_id: int, app_data: schemas.PurchasedAppCreate, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Contato não encontrado.")
    
    app_dict = app_data.model_dump()
    installments_data = app_dict.pop("installments", [])

    existing_app = db.query(models.PurchasedApp).filter(
        models.PurchasedApp.client_id == client_id,
        models.PurchasedApp.app_name == app_data.app_name
    ).first()

    if existing_app:
        existing_app.price = app_dict.get("price", existing_app.price)
        existing_app.payment_status = app_dict.get("payment_status", existing_app.payment_status)
        existing_app.installments_count = app_dict.get("installments_count", existing_app.installments_count)
        existing_app.renewal_date = app_dict.get("renewal_date", existing_app.renewal_date)
        existing_app.notes = app_dict.get("notes", existing_app.notes)
        
        # Limpar parcelas antigas se existirem novas parcelas enviadas
        if installments_data or app_data.payment_status == "paid":
            db.query(models.AppInstallment).filter(models.AppInstallment.app_id == existing_app.id).delete()
        
        if installments_data:
            for inst in installments_data:
                db_inst = models.AppInstallment(app_id=existing_app.id, **inst)
                db.add(db_inst)

        db.commit()
        db.refresh(existing_app)
        return existing_app

    db_app = models.PurchasedApp(client_id=client_id, **app_dict)
    db.add(db_app)
    db.commit()
    db.refresh(db_app)

    if installments_data:
        for inst in installments_data:
            db_inst = models.AppInstallment(app_id=db_app.id, **inst)
            db.add(db_inst)
        db.commit()
        db.refresh(db_app)

    return db_app

@router.patch(
    "/{client_id}/apps/{app_id}/installments/{installment_id}", 
    response_model=schemas.AppInstallmentResponse,
    summary="Atualizar Status da Parcela de uma Aplicação",
    description="""
    Atualiza o status de pagamento de uma parcela (ex: pending ou paid) e recalcula o status geral da contratação.

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** **SUPER_ADMIN** e **ADMIN**.
    """
)
def toggle_installment_status(client_id: int, app_id: int, installment_id: int, status: str, db: Session = Depends(get_db)):
    db_inst = db.query(models.AppInstallment).join(models.PurchasedApp).filter(
        models.AppInstallment.id == installment_id,
        models.AppInstallment.app_id == app_id,
        models.PurchasedApp.client_id == client_id
    ).first()

    if not db_inst:
        raise HTTPException(status_code=404, detail="Parcela não encontrada.")

    db_inst.status = status

    # Atualizar o status geral do aplicativo com base nas parcelas
    app = db_inst.app
    all_insts = db.query(models.AppInstallment).filter(models.AppInstallment.app_id == app_id).all()
    if all(i.status == "paid" for i in all_insts):
        app.payment_status = "paid"
    elif any(i.status == "pending" for i in all_insts):
        if app.installments_count > 1:
            app.payment_status = "installment"
        else:
            app.payment_status = "pending"

    db.commit()
    db.refresh(db_inst)
    return db_inst

@router.delete(
    "/{client_id}/apps/{app_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover Aplicação Contratada",
    description="""
    Exclui um registro de aplicação contratada pelo cliente.

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`).  
    👤 **Permissão:** **SUPER_ADMIN** e **ADMIN**.
    """
)
def delete_purchased_app(client_id: int, app_id: int, db: Session = Depends(get_db)):
    db_app = db.query(models.PurchasedApp).filter(
        models.PurchasedApp.id == app_id,
        models.PurchasedApp.client_id == client_id
    ).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Aplicação não encontrada.")
    
    db.delete(db_app)
    db.commit()
    return None

