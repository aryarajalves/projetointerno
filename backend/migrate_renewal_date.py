import os
from sqlalchemy import create_engine, text
from app.database import DATABASE_URL, Base

def migrate():
    print("Atualizando esquema do banco com coluna renewal_date em purchased_apps...")
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE purchased_apps ADD COLUMN renewal_date DATE NULL"))
            conn.commit()
            print("Coluna 'renewal_date' adicionada com sucesso em purchased_apps.")
        except Exception as e:
            print("Coluna 'renewal_date' ja existe ou nao pode ser adicionada:", e)

    print("Migracao de data de renovacao concluida com sucesso!")

if __name__ == "__main__":
    migrate()
