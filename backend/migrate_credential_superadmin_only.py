"""
Migração: Adiciona a coluna is_superadmin_only à tabela credentials
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/gerenciador_clientes")

if DATABASE_URL.startswith("sqlite"):
    import sqlite3
    db_path = DATABASE_URL.replace("sqlite:///", "")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE credentials ADD COLUMN is_superadmin_only BOOLEAN DEFAULT 0;")
        conn.commit()
        print("✅ Coluna is_superadmin_only adicionada com sucesso no SQLite.")
    except Exception as e:
        print(f"Nota/Erro SQLite: {e}")
    conn.close()
else:
    url = DATABASE_URL.replace("postgresql://", "")
    user_pass, host_db = url.split("@")
    user, password = user_pass.split(":", 1)
    host_port, dbname = host_db.split("/")
    if ":" in host_port:
        host, port = host_port.split(":")
    else:
        host = host_port
        port = "5432"

    conn = psycopg2.connect(
        dbname=dbname,
        user=user,
        password=password,
        host=host,
        port=int(port)
    )
    cursor = conn.cursor()

    print("Iniciando migração: adicionando is_superadmin_only à tabela credentials...")

    try:
        cursor.execute("ALTER TABLE credentials ADD COLUMN IF NOT EXISTS is_superadmin_only BOOLEAN DEFAULT FALSE NOT NULL;")
        print("✅ Coluna is_superadmin_only adicionada (ou já existia) no PostgreSQL.")
    except Exception as e:
        print(f"Erro ao adicionar is_superadmin_only: {e}")

    conn.commit()
    cursor.close()
    conn.close()
    print("Migração concluída com sucesso!")
