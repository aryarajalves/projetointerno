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

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200

def test_create_client():
    payload = {
        "name": "Cliente Teste",
        "notes": "Cliente muito importante"
    }
    response = client.post("/api/clients/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["notes"] == payload["notes"]
    assert "id" in data

def test_get_clients_pagination_and_search():
    client.post("/api/clients/", json={"name": "Ana Maria", "notes": "VIP"})
    client.post("/api/clients/", json={"name": "Bruno Silva", "notes": "Comum"})

    response = client.get("/api/clients/?page=1&limit=20")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2

    # Test Search
    search_resp = client.get("/api/clients/?search=Ana")
    assert search_resp.status_code == 200
    assert search_resp.json()["total"] == 1
    assert search_resp.json()["items"][0]["name"] == "Ana Maria"

def test_get_client_by_id():
    payload = {"name": "Cliente Detalhe"}
    created = client.post("/api/clients/", json=payload).json()

    response = client.get(f"/api/clients/{created['id']}")
    assert response.status_code == 200
    assert response.json()["name"] == "Cliente Detalhe"

def test_update_client():
    payload = {"name": "Nome Antigo"}
    created = client.post("/api/clients/", json=payload).json()

    update_payload = {"name": "Nome Novo", "notes": "Notas atualizadas"}
    response = client.put(f"/api/clients/{created['id']}", json=update_payload)
    assert response.status_code == 200
    assert response.json()["name"] == "Nome Novo"

def test_delete_client():
    payload = {"name": "Cliente Deletar"}
    created = client.post("/api/clients/", json=payload).json()

    del_resp = client.delete(f"/api/clients/{created['id']}")
    assert del_resp.status_code == 204

    get_resp = client.get(f"/api/clients/{created['id']}")
    assert get_resp.status_code == 404

def test_filter_clients_by_tickets_and_tasks():
    # 1. Criar clientes
    c1 = client.post("/api/clients/", json={"name": "Cliente Com Ticket"}).json()
    c2 = client.post("/api/clients/", json={"name": "Cliente Com Trello"}).json()
    c3 = client.post("/api/clients/", json={"name": "Cliente Limpo"}).json()

    # 2. Criar ticket para c1
    client.post("/api/tickets/", json={
        "client_id": c1["id"],
        "app_name": "AgentFlow",
        "title": "Bug grave",
        "description": "Erro de sincronia"
    })

    # 3. Criar tarefa no Trello para c2
    client.post(f"/api/clients/{c2['id']}/tasks", json={
        "title": "Demanda de Onboarding"
    })

    # 4. Filtrar por has_tickets=true
    resp_tickets = client.get("/api/clients/?has_tickets=true")
    assert resp_tickets.status_code == 200
    data_tickets = resp_tickets.json()
    assert data_tickets["total"] == 1
    assert data_tickets["items"][0]["name"] == "Cliente Com Ticket"

    # 5. Filtrar por has_tasks=true
    resp_tasks = client.get("/api/clients/?has_tasks=true")
    assert resp_tasks.status_code == 200
    data_tasks = resp_tasks.json()
    assert data_tasks["total"] == 1
    assert data_tasks["items"][0]["name"] == "Cliente Com Trello"

