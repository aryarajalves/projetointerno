import requests
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import urllib3
import re

from app import models
from app.database import get_db

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

router = APIRouter(
    prefix="/api/stack-update",
    tags=["Stack Update"]
)

class StackUpdateRequest(BaseModel):
    client_ids: List[int]
    new_image: str
    target_app: Optional[str] = "agentflow" # "agentflow", "zapjords", "oraculo", "zapgroup"

class ClientUpdateResult(BaseModel):
    client_id: int
    client_name: str
    status: str # "success", "error", "skipped"
    message: str

def get_app_stack_and_services(client: models.Client, target_app: str):
    app_key = (target_app or "agentflow").lower()
    
    if app_key == "zapjords":
        stack_name = client.zapjords_stack_name or client.portainer_stack_name
        service_name = client.zapjords_service_name or client.portainer_service_name
    elif app_key == "oraculo":
        stack_name = client.oraculo_stack_name or client.portainer_stack_name
        service_name = client.oraculo_service_name or client.portainer_service_name
    elif app_key == "zapgroup":
        stack_name = client.zapgroup_stack_name or client.portainer_stack_name
        service_name = client.zapgroup_service_name or client.portainer_service_name
    else:
        # Default / AgentFlow
        stack_name = client.agentflow_stack_name or client.portainer_stack_name
        service_name = client.agentflow_service_name or client.portainer_service_name

    return stack_name, service_name

def update_compose_image(stack_file_content: str, new_image: str, target_service_name: Optional[str]) -> str:
    """
    Substitui a imagem Docker no compose.
    Se target_service_name contiver vírgulas (ex: "app, worker, api"), atualiza os serviços informados.
    Se não for informado serviço específico, atualiza TODAS as tags 'image:' no compose.
    """
    if not target_service_name or not target_service_name.strip():
        # Atualiza TODOS os campos 'image: ...' no docker-compose
        return re.sub(r"(image:\s*)([^\s]+)", rf"\g<1>{new_image}", stack_file_content)

    services = [s.strip() for s in target_service_name.split(",") if s.strip()]
    updated_content = stack_file_content

    for svc in services:
        pattern = rf"(^\s*{re.escape(svc)}:\s*\n(?:[ \t]*\n|[ \t]+[^\n]+\n)*?[ \t]+image:\s*)([^\s]+)"
        if re.search(pattern, updated_content, re.MULTILINE | re.IGNORECASE):
            updated_content = re.sub(pattern, rf"\g<1>{new_image}", updated_content, flags=re.MULTILINE | re.IGNORECASE)
        else:
            fallback_pattern = rf"(\b{re.escape(svc)}\b[\s\S]*?\bimage:\s*)([^\s]+)"
            updated_content = re.sub(fallback_pattern, rf"\g<1>{new_image}", updated_content, count=1, flags=re.IGNORECASE)

    return updated_content

def update_single_client_portainer(client: models.Client, new_image: str, target_app: str) -> ClientUpdateResult:
    if not client.portainer_url or not client.portainer_username or not client.portainer_password:
        return ClientUpdateResult(
            client_id=client.id,
            client_name=client.name,
            status="skipped",
            message="Portainer não configurado para este cliente (URL/Usuário/Senha ausentes)."
        )

    target_stack_name, target_service_name = get_app_stack_and_services(client, target_app)

    if not target_stack_name:
        return ClientUpdateResult(
            client_id=client.id,
            client_name=client.name,
            status="skipped",
            message=f"Nome da Stack para a aplicação '{target_app.upper()}' não cadastrado para este cliente."
        )

    base_url = client.portainer_url.rstrip("/")
    session = requests.Session()
    session.verify = False

    try:
        # 1. Autenticação no Portainer
        auth_resp = session.post(
            f"{base_url}/api/auth",
            json={
                "username": client.portainer_username,
                "password": client.portainer_password
            },
            timeout=10
        )
        if auth_resp.status_code != 200:
            return ClientUpdateResult(
                client_id=client.id,
                client_name=client.name,
                status="error",
                message=f"Falha na autenticação Portainer (HTTP {auth_resp.status_code})."
            )
        
        jwt_token = auth_resp.json().get("jwt")
        headers = {"Authorization": f"Bearer {jwt_token}"}

        # 2. Buscar Stacks do Portainer
        stacks_resp = session.get(f"{base_url}/api/stacks", headers=headers, timeout=10)
        if stacks_resp.status_code != 200:
            return ClientUpdateResult(
                client_id=client.id,
                client_name=client.name,
                status="error",
                message=f"Falha ao listar Stacks (HTTP {stacks_resp.status_code})."
            )
        
        stacks = stacks_resp.json()
        
        target_stack = None
        for st in stacks:
            if st.get("Name", "").lower() == target_stack_name.lower():
                target_stack = st
                break

        if not target_stack:
            return ClientUpdateResult(
                client_id=client.id,
                client_name=client.name,
                status="error",
                message=f"Stack '{target_stack_name}' não encontrada no Portainer."
            )

        stack_id = target_stack["Id"]
        endpoint_id = target_stack.get("EndpointId", 1)

        # 3. Buscar detalhes do arquivo docker-compose da Stack
        file_resp = session.get(f"{base_url}/api/stacks/{stack_id}/file", headers=headers, timeout=10)
        if file_resp.status_code != 200:
            return ClientUpdateResult(
                client_id=client.id,
                client_name=client.name,
                status="error",
                message=f"Falha ao obter compose da Stack (HTTP {file_resp.status_code})."
            )

        stack_file_content = file_resp.json().get("StackFileContent", "")

        # 4. Atualizar as imagens nos serviços do Compose
        updated_content = update_compose_image(stack_file_content, new_image, target_service_name)

        # 5. Fazer PUT na Stack
        put_resp = session.put(
            f"{base_url}/api/stacks/{stack_id}?endpointId={endpoint_id}",
            headers=headers,
            json={
                "stackFileContent": updated_content,
                "env": target_stack.get("Env", []),
                "prune": True,
                "pullImage": True
            },
            timeout=30
        )

        if put_resp.status_code in (200, 201):
            svc_msg = f" (Serviços: {target_service_name})" if target_service_name else " (Todos os serviços)"
            return ClientUpdateResult(
                client_id=client.id,
                client_name=client.name,
                status="success",
                message=f"Stack '{target_stack.get('Name')}' ({target_app.upper()}){svc_msg} atualizada com sucesso para {new_image}!"
            )
        else:
            return ClientUpdateResult(
                client_id=client.id,
                client_name=client.name,
                status="error",
                message=f"Erro ao disparar deploy no Portainer (HTTP {put_resp.status_code}: {put_resp.text[:100]})."
            )

    except Exception as e:
        return ClientUpdateResult(
            client_id=client.id,
            client_name=client.name,
            status="error",
            message=f"Erro de conexão com Portainer ({str(e)})."
        )

@router.post(
    "/execute", 
    response_model=List[ClientUpdateResult],
    summary="Executar Atualização Automática de Stacks nos Servidores",
    description="""
    Conecta via API ao Portainer dos clientes selecionados, substitui a imagem Docker nos serviços do compose da aplicação informada (AgentFlow, ZapJords, Oraculo, ZapGroup) e dispara o redeploy automático.

    🔒 **Autenticação:** Requer Token JWT (`Bearer Token`) e o header `X-User-Role: SUPER_ADMIN`.  
    👤 **Permissão:** Exclusivo para **SUPER_ADMIN**.
    """
)
def execute_stack_update(
    req: StackUpdateRequest, 
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    db: Session = Depends(get_db)
):
    if x_user_role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas Super Admins possuem permissão para atualizar stacks de servidores."
        )

    if not req.client_ids:
        raise HTTPException(status_code=400, detail="Nenhum cliente selecionado.")

    clients = db.query(models.Client).filter(models.Client.id.in_(req.client_ids)).all()
    results = []

    for c in clients:
        res = update_single_client_portainer(c, req.new_image, req.target_app or "agentflow")
        results.append(res)

    return results
