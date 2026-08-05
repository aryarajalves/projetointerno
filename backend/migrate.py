import os
from sqlalchemy import create_engine, text
from app.database import DATABASE_URL, Base

def migrate():
    print("Atualizando esquema do banco com tabela credentials...")
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("Tabela credentials criada com sucesso!")

if __name__ == "__main__":
    migrate()
