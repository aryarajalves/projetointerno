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

def test_user_invite_and_registration():
    # 1. Gerar convite
    invite_payload = {
        "role": "USER",
        "valid_hours": 24,
        "allowed_client_ids": [1, 2]
    }
    invite_resp = client.post("/api/users/invite", json=invite_payload)
    assert invite_resp.status_code == 201
    token = invite_resp.json()["token"]

    # 2. Consultar token do convite
    get_inv = client.get(f"/api/users/invites/{token}")
    assert get_inv.status_code == 200
    assert get_inv.json()["role"] == "USER"

    # 3. Registrar novo usuário via convite
    reg_payload = {
        "name": "Novo Operador",
        "email": "operador@empresa.com",
        "password": "SenhaSegura123"
    }
    reg_resp = client.post(f"/api/users/invites/{token}/register", json=reg_payload)
    assert reg_resp.status_code == 201
    assert reg_resp.json()["email"] == "operador@empresa.com"
    assert reg_resp.json()["role"] == "USER"

    # 4. Listar usuários ativos
    users_list = client.get("/api/users/")
    assert users_list.status_code == 200
    assert len(users_list.json()) == 1

def test_user_client_restriction():
    # Criar 2 clientes
    c1 = client.post("/api/clients/", json={"name": "Cliente A", "type": "Cliente"}).json()
    c2 = client.post("/api/clients/", json={"name": "Cliente B", "type": "Cliente"}).json()

    # Criar convite apenas para c1["id"]
    invite_resp = client.post("/api/users/invite", json={"role": "USER", "valid_hours": 24, "allowed_client_ids": [c1["id"]]}).json()
    reg_resp = client.post(f"/api/users/invites/{invite_resp['token']}/register", json={"name": "User Restrito", "email": "restrito@empresa.com", "password": "123"}).json()
    user_id = reg_resp["id"]

    # Consultar /api/clients/?user_id={user_id}
    res = client.get(f"/api/clients/?user_id={user_id}")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Cliente A"
