import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def run_around_tests():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_support_tickets_crud():
    # 1. Criar contato
    contact_resp = client.post("/api/clients/", json={"name": "Contato Suporte", "type": "Cliente"})
    assert contact_resp.status_code == 201
    contact_id = contact_resp.json()["id"]

    # 2. Criar ticket de suporte (Problema)
    ticket_payload = {
        "client_id": contact_id,
        "app_name": "ZapJords",
        "ticket_type": "bug",
        "title": "Erro ao enviar mensagens em massa",
        "description": "Ao tentar disparar mensagens, ocorre timeout",
        "priority": "high",
        "attachments": [
            {
                "file_name": "erro.png",
                "file_type": "image/png",
                "file_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            }
        ]
    }
    create_resp = client.post("/api/tickets/", json=ticket_payload)
    assert create_resp.status_code == 201
    ticket_data = create_resp.json()
    assert ticket_data["title"] == "Erro ao enviar mensagens em massa"
    assert ticket_data["ticket_type"] == "bug"
    assert len(ticket_data["attachments"]) == 1
    ticket_id = ticket_data["id"]

    # 3. Listar tickets
    get_resp = client.get("/api/tickets/")
    assert get_resp.status_code == 200
    assert len(get_resp.json()) == 1

    # 4. Atualizar status para resolvida
    update_resp = client.put(f"/api/tickets/{ticket_id}", json={"status": "resolved"})
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "resolved"

    # 5. Deletar ticket
    del_resp = client.delete(f"/api/tickets/{ticket_id}")
    assert del_resp.status_code == 204
