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

def test_purchased_apps_crud():
    # 1. Criar contato
    contact_resp = client.post("/api/clients/", json={"name": "Contato Compras", "type": "Cliente"})
    assert contact_resp.status_code == 201
    contact_id = contact_resp.json()["id"]

    # 2. Registrar compra de aplicativo AgentFlow
    app1_payload = {
        "app_name": "AgentFlow",
        "price": 500.00
    }
    create_app1 = client.post(f"/api/clients/{contact_id}/apps", json=app1_payload)
    assert create_app1.status_code == 201
    assert create_app1.json()["app_name"] == "AgentFlow"
    assert create_app1.json()["price"] == 500.00

    # 3. Registrar compra de aplicativo ZapJords
    app2_payload = {
        "app_name": "ZapJords",
        "price": 750.00
    }
    create_app2 = client.post(f"/api/clients/{contact_id}/apps", json=app2_payload)
    assert create_app2.status_code == 201
    app2_id = create_app2.json()["id"]

    # 4. Listar aplicações contratadas
    get_apps_resp = client.get(f"/api/clients/{contact_id}/apps")
    assert get_apps_resp.status_code == 200
    assert len(get_apps_resp.json()) == 2

    # 5. Deletar compra
    del_resp = client.delete(f"/api/clients/{contact_id}/apps/{app2_id}")
    assert del_resp.status_code == 204

    # 6. Garantir que sobrou apenas 1
    get_apps_after = client.get(f"/api/clients/{contact_id}/apps")
    assert len(get_apps_after.json()) == 1

def test_purchased_app_installments():
    # 1. Criar contato
    contact_resp = client.post("/api/clients/", json={"name": "Contato Parcelado", "type": "Cliente"})
    contact_id = contact_resp.json()["id"]

    # 2. Registrar compra parcelada
    app_payload = {
        "app_name": "Oraculo",
        "price": 1000.0,
        "payment_status": "installment",
        "installments_count": 2,
        "installments": [
            {"installment_number": 1, "amount": 500.0, "due_date": "2026-08-10", "status": "paid"},
            {"installment_number": 2, "amount": 500.0, "due_date": "2026-09-10", "status": "pending"}
        ]
    }
    resp = client.post(f"/api/clients/{contact_id}/apps", json=app_payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["payment_status"] == "installment"
    assert len(data["installments"]) == 2
    assert data["installments"][0]["status"] == "paid"

    # 3. Dar baixa na segunda parcela via PATCH
    app_id = data["id"]
    inst_id = data["installments"][1]["id"]
    patch_resp = client.patch(f"/api/clients/{contact_id}/apps/{app_id}/installments/{inst_id}?status=paid")
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "paid"

def test_purchased_app_upfront_pending():
    # 1. Criar contato
    contact_resp = client.post("/api/clients/", json={"name": "Contato À Vista Pendente", "type": "Cliente"})
    contact_id = contact_resp.json()["id"]

    # 2. Registrar compra à vista pendente com data prevista
    app_payload = {
        "app_name": "ZapGroup",
        "price": 1500.0,
        "payment_status": "pending",
        "installments_count": 1,
        "installments": [
            {"installment_number": 1, "amount": 1500.0, "due_date": "2026-08-25", "status": "pending"}
        ]
    }
    resp = client.post(f"/api/clients/{contact_id}/apps", json=app_payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["payment_status"] == "pending"
    assert len(data["installments"]) == 1
    assert data["installments"][0]["due_date"] == "2026-08-25"
    assert data["installments"][0]["status"] == "pending"

    # 3. Dar baixa no pagamento à vista pendente
    app_id = data["id"]
    inst_id = data["installments"][0]["id"]
    patch_resp = client.patch(f"/api/clients/{contact_id}/apps/{app_id}/installments/{inst_id}?status=paid")
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "paid"

    # 4. Verificar se o status da aplicação mudou para 'paid'
    get_resp = client.get(f"/api/clients/{contact_id}/apps")
    updated_app = next(a for a in get_resp.json() if a["id"] == app_id)
    assert updated_app["payment_status"] == "paid"

