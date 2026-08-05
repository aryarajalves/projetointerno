"""
Migração: Adiciona colunas de stack e serviço para cada aplicação (AgentFlow, ZapJords, Oraculo, ZapGroup)
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/gerenciador_db")

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

print("Iniciando migração: adicionando stacks e serviços por aplicação...")

columns = [
    ("agentflow_stack_name", "VARCHAR(255)"),
    ("agentflow_service_name", "VARCHAR(255)"),
    ("zapjords_stack_name", "VARCHAR(255)"),
    ("zapjords_service_name", "VARCHAR(255)"),
    ("oraculo_stack_name", "VARCHAR(255)"),
    ("oraculo_service_name", "VARCHAR(255)"),
    ("zapgroup_stack_name", "VARCHAR(255)"),
    ("zapgroup_service_name", "VARCHAR(255)"),
]

for col_name, col_type in columns:
    try:
        cursor.execute(f"ALTER TABLE clients ADD COLUMN IF NOT EXISTS {col_name} {col_type} NULL;")
        print(f"✅ Coluna {col_name} adicionada.")
    except Exception as e:
        print(f"Erro ao adicionar {col_name}: {e}")

conn.commit()
cursor.close()
conn.close()
print("Migração concluída com sucesso!")
