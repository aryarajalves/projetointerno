import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "sql_app.db")

def migrate():
    print(f"Verificando migração da tabela client_attachments em {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS client_attachments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_type VARCHAR(50) NOT NULL,
            file_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()
    print("Tabela client_attachments verificada/criada com sucesso.")

if __name__ == "__main__":
    migrate()
