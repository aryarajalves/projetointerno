import os
from sqlalchemy import create_engine, text

def run_migration():
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/cliente_gerenciador")
    print(f"Conectando ao banco de dados: {database_url}")
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        # 1. Adicionar colunas 'name' e 'status' à tabela users se não existirem
        print("Verificando colunas 'name' e 'status' na tabela users...")
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';"))
            conn.commit()
            print("Colunas 'name' e 'status' verificadas/adicionadas à tabela users!")
        except Exception as e:
            print(f"Aviso ao alterar tabela users: {e}")

        # 2. Criar tabela invites se não existir
        print("Criando tabela invites...")
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS invites (
                    id SERIAL PRIMARY KEY,
                    token VARCHAR(255) UNIQUE NOT NULL,
                    role VARCHAR(50) NOT NULL DEFAULT 'USER',
                    valid_hours INTEGER NOT NULL DEFAULT 24,
                    allowed_client_ids TEXT,
                    expires_at TIMESTAMP NOT NULL,
                    used BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            conn.commit()
            print("Tabela invites criada com sucesso!")
        except Exception as e:
            print(f"Aviso ao criar tabela invites: {e}")

        # 3. Criar tabela user_client_permissions se não existir
        print("Criando tabela user_client_permissions...")
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS user_client_permissions (
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
                    PRIMARY KEY (user_id, client_id)
                );
            """))
            conn.commit()
            print("Tabela user_client_permissions criada com sucesso!")
        except Exception as e:
            print(f"Aviso ao criar tabela user_client_permissions: {e}")

if __name__ == "__main__":
    run_migration()
