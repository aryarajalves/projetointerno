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

def test_tasks_crud():
    # 1. Criar cliente
    c_resp = client.post("/api/clients/", json={"name": "Cliente Trello", "type": "Cliente"})
    c_id = c_resp.json()["id"]

    # 2. Criar tarefa
    task_payload = {
        "title": "Criar campanha de testes",
        "description": "Desenvolver os fluxos do ZapVoice",
        "status": "todo",
        "due_date": "2026-08-15"
    }
    create_task = client.post(f"/api/clients/{c_id}/tasks", json=task_payload)
    assert create_task.status_code == 201
    task_id = create_task.json()["id"]
    assert create_task.json()["status"] == "todo"

    # 3. Mover tarefa para 'in_progress'
    update_task = client.put(f"/api/clients/{c_id}/tasks/{task_id}", json={"status": "in_progress"})
    assert update_task.status_code == 200
    assert update_task.json()["status"] == "in_progress"

    # 4. Listar tarefas do cliente
    get_tasks = client.get(f"/api/clients/{c_id}/tasks")
    assert get_tasks.status_code == 200
    assert len(get_tasks.json()) == 1

    # 5. Deletar tarefa
    del_task = client.delete(f"/api/clients/{c_id}/tasks/{task_id}")
    assert del_task.status_code == 204
