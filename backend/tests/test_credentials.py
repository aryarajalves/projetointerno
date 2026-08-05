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

def test_credentials_crud():
    # 1. Criar contato
    contact_resp = client.post("/api/clients/", json={"name": "Contato Credencial", "type": "Cliente"})
    assert contact_resp.status_code == 201
    contact_id = contact_resp.json()["id"]

    # 2. Criar credencial de acesso
    cred_payload = {
        "title": "ZapVoice Dashboard",
        "access_url": "https://app.zapvoice.com",
        "username": "admin@empresa.com",
        "password": "SenhaSegura123"
    }
    create_cred_resp = client.post(f"/api/clients/{contact_id}/credentials", json=cred_payload)
    assert create_cred_resp.status_code == 201
    cred_id = create_cred_resp.json()["id"]
    assert create_cred_resp.json()["title"] == "ZapVoice Dashboard"

    # 3. Atualizar credencial (PUT)
    update_payload = {
        "title": "ZapVoice Editado",
        "access_url": "https://app.zapvoice.com/v2",
        "username": "admin@empresa.com",
        "password": "NovaSenha456"
    }
    put_cred_resp = client.put(f"/api/clients/{contact_id}/credentials/{cred_id}", json=update_payload)
    assert put_cred_resp.status_code == 200
    assert put_cred_resp.json()["title"] == "ZapVoice Editado"

    # 4. Listar credenciais com paginação
    get_creds_resp = client.get(f"/api/clients/{contact_id}/credentials?page=1&limit=10")
    assert get_creds_resp.status_code == 200
    data = get_creds_resp.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1

    # 5. Deletar credencial
    del_cred_resp = client.delete(f"/api/clients/{contact_id}/credentials/{cred_id}")
    assert del_cred_resp.status_code == 204

def test_credentials_superadmin_only_filtering():
    # 1. Criar contato
    contact_resp = client.post("/api/clients/", json={"name": "Contato Restrito", "type": "Cliente"})
    assert contact_resp.status_code == 201
    contact_id = contact_resp.json()["id"]

    # 2. Criar credencial normal
    client.post(f"/api/clients/{contact_id}/credentials", json={
        "title": "Credencial Normal",
        "username": "user1",
        "password": "pass1",
        "is_superadmin_only": False
    })

    # 3. Criar credencial restrita ao Super Admin
    client.post(f"/api/clients/{contact_id}/credentials", json={
        "title": "Credencial Confidencial SuperAdmin",
        "username": "admin_root",
        "password": "super_secret_pass",
        "is_superadmin_only": True
    })

    # 4. Consulta como SUPER_ADMIN (deve retornar ambas as 2 credenciais)
    res_superadmin = client.get(
        f"/api/clients/{contact_id}/credentials",
        headers={"X-User-Role": "SUPER_ADMIN"}
    )
    assert res_superadmin.status_code == 200
    data_super = res_superadmin.json()
    assert data_super["total"] == 2
    assert len(data_super["items"]) == 2

    # 5. Consulta como USER comum (deve retornar apenas 1 credencial, a normal)
    res_user = client.get(
        f"/api/clients/{contact_id}/credentials",
        headers={"X-User-Role": "USER"}
    )
    assert res_user.status_code == 200
    data_user = res_user.json()
    assert data_user["total"] == 1
    assert len(data_user["items"]) == 1
    assert data_user["items"][0]["title"] == "Credencial Normal"

