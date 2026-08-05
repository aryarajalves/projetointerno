import os
from sqlalchemy import create_engine, text
from app.database import DATABASE_URL, Base

def migrate():
    print("Atualizando esquema do banco com coluna due_date em support_tickets...")
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE support_tickets ADD COLUMN due_date TIMESTAMP NULL"))
            conn.commit()
            print("Coluna 'due_date' adicionada com sucesso em support_tickets.")
        except Exception as e:
            print("Coluna 'due_date' ja existe ou nao pode ser adicionada:", e)

    print("Migracao de prazo do ticket concluida com sucesso!")

if __name__ == "__main__":
    migrate()
