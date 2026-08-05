import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database import Base, get_db
from app.routers import auth

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
    db = TestingSessionLocal()
    auth.init_super_admin(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_login_success():
    resp = client.post("/api/auth/login", json={
        "email": "aryarajmarketing@gmail.com",
        "password": "123456"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["user"]["email"] == "aryarajmarketing@gmail.com"
    assert data["user"]["role"] == "SUPER_ADMIN"

def test_login_invalid_password():
    resp = client.post("/api/auth/login", json={
        "email": "aryarajmarketing@gmail.com",
        "password": "senha_errada"
    })
    assert resp.status_code == 401
