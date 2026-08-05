import os
from sqlalchemy import create_engine, text
from app.database import DATABASE_URL, Base

def migrate():
    print("Atualizando esquema do banco com coluna created_by_id em support_tickets...")
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE support_tickets ADD COLUMN created_by_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL"))
            conn.commit()
            print("Coluna 'created_by_id' adicionada com sucesso em support_tickets.")
        except Exception as e:
            print("Coluna 'created_by_id' ja existe ou nao pode ser adicionada:", e)

    print("Migracao do criador do ticket concluida com sucesso!")

if __name__ == "__main__":
    migrate()
