# 💼 Gerenciador de Clientes & CRM Interno

Sistema de gerenciamento interno de clientes, leads, credenciais de acesso, aplicações contratadas, quadro de tarefas estilo Trello e tickets de suporte.

---

## 🚀 Funcionalidades Principais

- 👥 **Gestão de Contatos (Leads e Clientes):**
  - Cadastro, edição, exclusão e conversão de Leads em Clientes.
  - Filtros avançados por tipo, busca e paginação.

- 📋 **Quadro Trello & Evolução de Atividades:**
  - Quadro de tarefas estilo Kanban exclusivo para cada cliente.
  - Colunas personalizáveis (*A Fazer*, *Em Progresso*, *Concluído*).
  - Checklist de subetapas, prazos de entrega e anexos.

- 📦 **Aplicações e Ferramentas Contratadas:**
  - Mapeamento completo dos sistemas adquiridos pelo cliente.
  - Registro de valores investidos, parcelamentos e datas de renovação.

- 🔑 **Cofre de Senhas & Acessos:**
  - Armazenamento seguro de credenciais, links de acesso e chaves de API.
  - Controle de visibilidade por perfil de usuário (*SUPER_ADMIN*, *ADMIN*, *USER*).

- 🎫 **Central de Tickets de Suporte:**
  - Abertura, acompanhamento e resolução de tickets de suporte por cliente e aplicação.

- 🔄 **Dashboard de Atualização de Stacks / Servidores:**
  - Painel para acompanhamento de atualizações de versão de sistemas nos servidores dos clientes.

- 👤 **Controle de Usuários e Permissões:**
  - Níveis de acesso granulares (*SUPER_ADMIN*, *ADMIN*, *USER*).
  - Gestão de convites e usuários do sistema.

---

## 🛠️ Tecnologias Utilizadas

### **Backend**
- **Linguagem/Framework:** Python 3.11 + FastAPI
- **Banco de Dados:** PostgreSQL 15 (SQLAlchemy ORM)
- **Autenticação:** PyJWT (JSON Web Tokens) & Passlib (Bcrypt)
- **Testes:** Pytest

### **Frontend**
- **Framework:** React 18 + Vite
- **Testes:** Vitest + React Testing Library
- **Estilização:** Vanilla CSS com design system customizado (Glassmorphism & Neon Dark Mode)

### **Infraestrutura**
- **Containers:** Docker & Docker Compose

---

## 💻 Como Executar o Projeto Localmente (Docker)

### **Pré-requisitos:**
- [Docker](https://www.docker.com/) e Docker Compose instalados.

### **Passos para execução:**

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/aryarajalves/projetointerno.git
   cd projetointerno
   ```

2. **Subir os containers:**
   ```bash
   docker compose -f docker-compose-local.yml up -d --force-recreate
   ```

3. **Acessar a aplicação:**
   - **Frontend:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:8000](http://localhost:8000)
   - **Documentação Swagger (API Docs):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔑 Credenciais Padrão (Desenvolvimento)

- **E-mail:** `aryarajmarketing@gmail.com`
- **Senha:** `123456`

---

## 🧪 Executando os Testes Unitários

### **Testes do Frontend (Vitest):**
```bash
cd frontend
npm test -- --run
```

### **Testes do Backend (Pytest no Container):**
```bash
docker exec cliente_gerenciador_backend pytest
```

---

## 📁 Estrutura do Repositório

```text
.
├── backend/                  # API FastAPI Python (Modelos, Rotas, Schemas, Testes)
│   ├── app/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # Interface React + Vite (Componentes, Contextos, Testes)
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── docker-compose-local.yml  # Configuração de containers locais (DB, Backend, Frontend)
├── DATABASE_SCHEMA_LOG.md    # Histórico de alterações do banco de dados
└── README.md                 # Documentação do projeto
```

---

## 📝 Licença

Projeto interno de uso exclusivo.
