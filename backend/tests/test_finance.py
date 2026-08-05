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

def test_financial_summary():
    # 1. Criar cliente
    c_resp = client.post("/api/clients/", json={"name": "Cliente Financeiro", "type": "Cliente"})
    c_id = c_resp.json()["id"]

    # 2. Registrar compras
    client.post(f"/api/clients/{c_id}/apps", json={"app_name": "AgentFlow", "price": 1000.00})
    client.post(f"/api/clients/{c_id}/apps", json={"app_name": "ZapJords", "price": 1500.00})

    # 3. Consultar resumo financeiro
    resp = client.get("/api/finance/summary")
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_revenue"] == 2500.00
    assert data["today_revenue"] == 2500.00
    assert len(data["apps_summary"]) == 4
