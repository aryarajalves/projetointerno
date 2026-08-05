from sqlalchemy import text
from app.database import engine

def migrate():
    columns = [
        ("email", "VARCHAR(255)"),
        ("phone_whatsapp", "VARCHAR(50)"),
        ("instagram", "VARCHAR(255)"),
        ("address", "VARCHAR(500)"),
        ("city", "VARCHAR(255)"),
        ("state", "VARCHAR(100)")
    ]

    with engine.connect() as conn:
        for col_name, col_type in columns:
            try:
                conn.execute(text(f"ALTER TABLE clients ADD COLUMN {col_name} {col_type};"))
                conn.commit()
                print(f"Coluna {col_name} adicionada com sucesso.")
            except Exception as e:
                print(f"Coluna {col_name} não precisou ser adicionada ou já existe ({e}).")

if __name__ == "__main__":
    migrate()
