from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Float, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

# Tabela M:N de Usuários e Permissões de Clientes
user_client_permissions = Table(
    'user_client_permissions',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('client_id', Integer, ForeignKey('clients.id', ondelete='CASCADE'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), default="USER", nullable=False) # 'SUPER_ADMIN', 'ADMIN', 'USER'
    status = Column(String(50), default="active", nullable=False) # 'active', 'inactive'
    created_at = Column(DateTime, default=datetime.utcnow)

    allowed_clients = relationship("Client", secondary=user_client_permissions, backref="allowed_users")

class Invite(Base):
    __tablename__ = "invites"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    role = Column(String(50), default="USER", nullable=False) # 'ADMIN', 'USER'
    valid_hours = Column(Integer, default=24, nullable=False)
    allowed_client_ids = Column(Text, nullable=True) # Guarda IDs separados por vírgula "1,2,5"
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), default="Lead", nullable=False)
    notes = Column(Text, nullable=True)
    
    # Informações adicionais do contato (opcionais)
    email = Column(String(255), nullable=True)
    phone_whatsapp = Column(String(50), nullable=True)
    instagram = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(255), nullable=True)
    state = Column(String(100), nullable=True)

    is_pinned = Column(Boolean, default=False, nullable=False) # Fixado no topo
    server_ip = Column(String(255), nullable=True)      # IP do servidor do cliente
    server_password = Column(String(500), nullable=True) # Senha do servidor (visível só ao SUPER_ADMIN)
    portainer_url = Column(String(500), nullable=True)
    portainer_username = Column(String(255), nullable=True)
    portainer_password = Column(String(500), nullable=True)
    
    # Stacks e Serviços específicos de cada aplicação
    agentflow_stack_name = Column(String(255), nullable=True)
    agentflow_service_name = Column(String(255), nullable=True)

    zapjords_stack_name = Column(String(255), nullable=True)
    zapjords_service_name = Column(String(255), nullable=True)

    oraculo_stack_name = Column(String(255), nullable=True)
    oraculo_service_name = Column(String(255), nullable=True)

    zapgroup_stack_name = Column(String(255), nullable=True)
    zapgroup_service_name = Column(String(255), nullable=True)

    # Mantém fallback por compatibilidade
    portainer_stack_name = Column(String(255), nullable=True)
    portainer_service_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    credentials = relationship("Credential", back_populates="client", cascade="all, delete-orphan")
    apps = relationship("PurchasedApp", back_populates="client", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="client", cascade="all, delete-orphan")
    tickets = relationship("SupportTicket", back_populates="client", cascade="all, delete-orphan")
    attachments = relationship("ClientAttachment", back_populates="client", cascade="all, delete-orphan")

class ClientAttachment(Base):
    __tablename__ = "client_attachments"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_data = Column(Text, nullable=False) # Base64 ou Data URI
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="attachments")

class Credential(Base):
    __tablename__ = "credentials"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    access_url = Column(String(500), nullable=True)
    username = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    is_superadmin_only = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="credentials")

class PurchasedApp(Base):
    __tablename__ = "purchased_apps"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    app_name = Column(String(100), nullable=False)
    price = Column(Float, nullable=False, default=0.0)
    payment_status = Column(String(50), nullable=False, default="paid") # 'paid' (À Vista), 'installment' (Parcelado)
    installments_count = Column(Integer, nullable=False, default=1)
    renewal_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="apps")
    installments = relationship("AppInstallment", back_populates="app", cascade="all, delete-orphan", order_by="AppInstallment.installment_number")

class AppInstallment(Base):
    __tablename__ = "app_installments"

    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(Integer, ForeignKey("purchased_apps.id", ondelete="CASCADE"), nullable=False)
    installment_number = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False, default=0.0)
    due_date = Column(Date, nullable=True)
    status = Column(String(50), nullable=False, default="pending") # 'paid', 'pending'
    created_at = Column(DateTime, default=datetime.utcnow)

    app = relationship("PurchasedApp", back_populates="installments")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="todo", nullable=False)
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    subtasks = relationship("Subtask", back_populates="task", cascade="all, delete-orphan")
    attachments = relationship("TaskAttachment", back_populates="task", cascade="all, delete-orphan")
    client = relationship("Client", back_populates="tasks")

class Subtask(Base):
    __tablename__ = "subtasks"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="subtasks")

class TaskAttachment(Base):
    __tablename__ = "task_attachments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_data = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="attachments")

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    app_name = Column(String(100), nullable=False) # AgentFlow, ZapJords, Oraculo, ZapGroup, Outro
    ticket_type = Column(String(50), nullable=False, default="bug") # 'bug' (Problema), 'enhancement' (Melhoria)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="open") # 'open', 'in_progress', 'resolved', 'closed'
    priority = Column(String(50), nullable=False, default="medium") # 'low', 'medium', 'high', 'urgent'
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="tickets")
    creator = relationship("User")
    attachments = relationship("TicketAttachment", back_populates="ticket", cascade="all, delete-orphan")

class TicketAttachment(Base):
    __tablename__ = "ticket_attachments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_data = Column(Text, nullable=False) # Base64 ou Data URI
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("SupportTicket", back_populates="attachments")

