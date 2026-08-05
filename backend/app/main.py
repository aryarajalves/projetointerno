import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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

cors_origins_env = os.getenv("CORS_ORIGINS", "*")
origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()] if cors_origins_env != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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

# Servir arquivos estáticos do frontend (se a pasta static existir no build unificado)
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(static_dir, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {"status": "Online", "message": "Central de Suporte API rodando com sucesso!"}

