from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

# Auth & User Schemas
class LoginRequest(BaseModel):
    email: str
    password: str

class SimpleClientResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    name: Optional[str] = None
    email: str
    role: str
    status: str
    created_at: datetime
    allowed_clients: List[SimpleClientResponse] = []

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    allowed_client_ids: Optional[List[int]] = None

class PasswordResetRequest(BaseModel):
    new_password: str

class LoginResponse(BaseModel):
    token: str
    user: UserResponse

# Invite Schemas
class InviteCreate(BaseModel):
    role: str = "USER" # 'ADMIN' ou 'USER'
    valid_hours: int = 24 # 24, 48, 72, 168
    allowed_client_ids: Optional[List[int]] = []

class InviteResponse(BaseModel):
    id: int
    token: str
    role: str
    valid_hours: int
    allowed_client_ids: Optional[str] = None
    expires_at: datetime
    used: bool
    created_at: datetime

    class Config:
        from_attributes = True

class InviteRegisterRequest(BaseModel):
    name: str
    email: str
    password: str

# Client Schemas
class ClientBase(BaseModel):
    name: str
    type: Optional[str] = "Lead"
    notes: Optional[str] = None
    email: Optional[str] = None
    phone_whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_pinned: Optional[bool] = False
    server_ip: Optional[str] = None
    server_password: Optional[str] = None
    portainer_url: Optional[str] = None
    portainer_username: Optional[str] = None
    portainer_password: Optional[str] = None
    agentflow_stack_name: Optional[str] = None
    agentflow_service_name: Optional[str] = None
    zapjords_stack_name: Optional[str] = None
    zapjords_service_name: Optional[str] = None
    oraculo_stack_name: Optional[str] = None
    oraculo_service_name: Optional[str] = None
    zapgroup_stack_name: Optional[str] = None
    zapgroup_service_name: Optional[str] = None
    portainer_stack_name: Optional[str] = None
    portainer_service_name: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    notes: Optional[str] = None
    email: Optional[str] = None
    phone_whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_pinned: Optional[bool] = None
    server_ip: Optional[str] = None
    server_password: Optional[str] = None
    portainer_url: Optional[str] = None
    portainer_username: Optional[str] = None
    portainer_password: Optional[str] = None
    agentflow_stack_name: Optional[str] = None
    agentflow_service_name: Optional[str] = None
    zapjords_stack_name: Optional[str] = None
    zapjords_service_name: Optional[str] = None
    oraculo_stack_name: Optional[str] = None
    oraculo_service_name: Optional[str] = None
    zapgroup_stack_name: Optional[str] = None
    zapgroup_service_name: Optional[str] = None
    portainer_stack_name: Optional[str] = None
    portainer_service_name: Optional[str] = None

# Client Attachment Schemas
class ClientAttachmentBase(BaseModel):
    file_name: str
    file_type: str
    file_data: str

class ClientAttachmentCreate(ClientAttachmentBase):
    pass

class ClientAttachmentResponse(ClientAttachmentBase):
    id: int
    client_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ClientResponse(ClientBase):
    id: int
    created_at: datetime
    attachments: List[ClientAttachmentResponse] = []

    class Config:
        from_attributes = True

class ClientListResponse(BaseModel):
    items: List[ClientResponse]
    total: int
    page: int
    limit: int
    pages: int

# Credential Schemas
class CredentialBase(BaseModel):
    title: str
    access_url: Optional[str] = None
    username: str
    password: str
    notes: Optional[str] = None
    is_superadmin_only: Optional[bool] = False

class CredentialCreate(CredentialBase):
    pass

class CredentialResponse(CredentialBase):
    id: int
    client_id: int
    is_superadmin_only: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class CredentialListResponse(BaseModel):
    items: List[CredentialResponse]
    total: int
    page: int
    limit: int
    pages: int

# AppInstallment Schemas
class AppInstallmentBase(BaseModel):
    installment_number: int
    amount: float
    due_date: Optional[date] = None
    status: Optional[str] = "pending" # 'paid', 'pending'

class AppInstallmentCreate(AppInstallmentBase):
    pass

class AppInstallmentResponse(AppInstallmentBase):
    id: int
    app_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# PurchasedApp Schemas
class PurchasedAppBase(BaseModel):
    app_name: str
    price: float
    payment_status: Optional[str] = "paid" # 'paid', 'installment'
    installments_count: Optional[int] = 1
    renewal_date: Optional[date] = None
    notes: Optional[str] = None

class PurchasedAppCreate(PurchasedAppBase):
    installments: Optional[List[AppInstallmentCreate]] = []

class PurchasedAppResponse(PurchasedAppBase):
    id: int
    client_id: int
    created_at: datetime
    installments: List[AppInstallmentResponse] = []

    class Config:
        from_attributes = True


# Task Attachment Schemas
class TaskAttachmentBase(BaseModel):
    file_name: str
    file_type: str
    file_data: str

class TaskAttachmentCreate(TaskAttachmentBase):
    pass

class TaskAttachmentResponse(TaskAttachmentBase):
    id: int
    task_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Subtask Schemas
class SubtaskBase(BaseModel):
    title: str
    completed: Optional[bool] = False

class SubtaskCreate(SubtaskBase):
    pass

class SubtaskResponse(SubtaskBase):
    id: int
    task_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Task Schemas for Trello / Kanban
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "todo"
    due_date: Optional[date] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[date] = None

class TaskResponse(TaskBase):
    id: int
    client_id: int
    created_at: datetime
    subtasks: List[SubtaskResponse] = []
    attachments: List[TaskAttachmentResponse] = []

    class Config:
        from_attributes = True

# Ticket Attachment Schemas
class TicketAttachmentBase(BaseModel):
    file_name: str
    file_type: str
    file_data: str

class TicketAttachmentCreate(TicketAttachmentBase):
    pass

class TicketAttachmentResponse(TicketAttachmentBase):
    id: int
    ticket_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Support Ticket Schemas
class SupportTicketBase(BaseModel):
    client_id: int
    app_name: str # AgentFlow, ZapJords, Oraculo, ZapGroup, Outro
    ticket_type: Optional[str] = "bug" # 'bug' (Problema), 'enhancement' (Melhoria)
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium" # 'low', 'medium', 'high', 'urgent'
    created_by_id: Optional[int] = None
    due_date: Optional[datetime] = None

class SupportTicketCreate(SupportTicketBase):
    attachments: Optional[List[TicketAttachmentCreate]] = []

class SupportTicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None # 'open', 'in_progress', 'resolved', 'closed'
    priority: Optional[str] = None
    ticket_type: Optional[str] = None
    app_name: Optional[str] = None
    client_id: Optional[int] = None
    due_date: Optional[datetime] = None

class SupportTicketResponse(SupportTicketBase):
    id: int
    status: str
    created_at: datetime
    client_name: Optional[str] = None
    created_by_name: Optional[str] = None
    attachments: List[TicketAttachmentResponse] = []

    class Config:
        from_attributes = True


