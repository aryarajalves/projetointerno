from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routers import clients, credentials, apps, auth, finance, tasks, users, tickets, stack_update

# Criar tabelas se não existirem
Base.metadata.create_all(bind=engine)

# Inicializar Super Admin na subida da aplicação
db = SessionLocal()
try:
    auth.init_super_admin(db)
finally:
    db.close()

app = FastAPI(
    title="Central de Suporte - API",
    description="API RESTful para Gerenciador de Clientes e Central de Suporte",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(clients.router)
app.include_router(credentials.router)
app.include_router(apps.router)
app.include_router(finance.router)
app.include_router(tasks.router)
app.include_router(tickets.router)
app.include_router(stack_update.router)

@app.get("/")
def read_root():
    return {"status": "Online", "message": "Central de Suporte API rodando com sucesso!"}
