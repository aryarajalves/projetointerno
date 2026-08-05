import os
from sqlalchemy import create_engine, text
from app.database import DATABASE_URL, Base
from app.models import PurchasedApp, AppInstallment

def migrate():
    print("Atualizando esquema do banco com tabela app_installments e colunas em purchased_apps...")
    engine = create_engine(DATABASE_URL)
    
    # Criar tabela app_installments se não existir
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        # Tentar adicionar coluna payment_status em purchased_apps se não existir
        try:
            conn.execute(text("ALTER TABLE purchased_apps ADD COLUMN payment_status VARCHAR(50) DEFAULT 'paid'"))
            conn.commit()
            print("Coluna 'payment_status' adicionada com sucesso em purchased_apps.")
        except Exception as e:
            print("Coluna 'payment_status' ja existe ou nao pode ser adicionada:", e)

        # Tentar adicionar coluna installments_count em purchased_apps se não existir
        try:
            conn.execute(text("ALTER TABLE purchased_apps ADD COLUMN installments_count INTEGER DEFAULT 1"))
            conn.commit()
            print("Coluna 'installments_count' adicionada com sucesso em purchased_apps.")
        except Exception as e:
            print("Coluna 'installments_count' ja existe ou nao pode ser adicionada:", e)

    print("Migracao de pagamentos de aplicacoes concluida com sucesso!")

if __name__ == "__main__":
    migrate()
