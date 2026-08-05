import os
from sqlalchemy import create_engine
from app.database import DATABASE_URL, Base
from app.models import SupportTicket, TicketAttachment

def migrate():
    print("Atualizando esquema do banco com tabelas support_tickets e ticket_attachments...")
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("Migracao de tickets de suporte concluida com sucesso!")

if __name__ == "__main__":
    migrate()
