"""
Migração: Adiciona colunas server_ip e server_password à tabela clients
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/gerenciador_db")

# Extrai os componentes da URL
# postgresql://user:password@host:port/dbname
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

print("Iniciando migração: adicionando server_ip e server_password à tabela clients...")

try:
    cursor.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS server_ip VARCHAR(255) NULL;")
    print("✅ Coluna server_ip adicionada (ou já existia).")
except Exception as e:
    print(f"Erro ao adicionar server_ip: {e}")

try:
    cursor.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS server_password VARCHAR(500) NULL;")
    print("✅ Coluna server_password adicionada (ou já existia).")
except Exception as e:
    print(f"Erro ao adicionar server_password: {e}")

conn.commit()
cursor.close()
conn.close()
print("Migração concluída com sucesso!")
