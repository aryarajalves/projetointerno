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

def test_stack_update_requires_superadmin_role():
    payload = {
        "client_ids": [1],
        "new_image": "ghcr.io/test/app:v1.0.0",
        "target_app": "agentflow"
    }

    # 1. Sem header X-User-Role -> 403
    resp_no_role = client.post("/api/stack-update/execute", json=payload)
    assert resp_no_role.status_code == 403
    assert "Apenas Super Admins" in resp_no_role.json()["detail"]

    # 2. Com role ADMIN -> 403
    resp_admin = client.post(
        "/api/stack-update/execute",
        json=payload,
        headers={"X-User-Role": "ADMIN"}
    )
    assert resp_admin.status_code == 403

    # 3. Com role SUPER_ADMIN -> Passa da verificação de autorização (200 com array de resultados)
    c1 = client.post("/api/clients/", json={"name": "Cliente Teste Stacks"}).json()
    resp_super = client.post(
        "/api/stack-update/execute",
        json={"client_ids": [c1["id"]], "new_image": "v1.0.0"},
        headers={"X-User-Role": "SUPER_ADMIN"}
    )
    assert resp_super.status_code == 200
    assert isinstance(resp_super.json(), list)
