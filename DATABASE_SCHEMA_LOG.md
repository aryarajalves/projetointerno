# Log de Alterações do Esquema do Banco de Dados (DATABASE_SCHEMA_LOG.md)

| Data | Tabela Afetada | Alteração / Novas Colunas | Script de Migração |
|------|----------------|---------------------------|---------------------|
| 2026-08-03 | `purchased_apps` | Adicionadas colunas `payment_status` (VARCHAR) e `installments_count` (INT) | `backend/migrate_app_payment.py` |
| 2026-08-03 | `support_tickets` | Criada tabela com `id`, `client_id`, `app_name`, `ticket_type`, `title`, `description`, `status`, `priority`, `created_at` | `backend/migrate_support_tickets.py` |
| 2026-08-03 | `ticket_attachments` | Criada tabela de anexos com `id`, `ticket_id`, `file_name`, `file_type`, `file_data`, `created_at` | `backend/migrate_support_tickets.py` |
| 2026-08-03 | `purchased_apps` | Adicionada coluna `renewal_date` (DATE) | `backend/migrate_renewal_date.py` |
| 2026-08-03 | `support_tickets` | Adicionada coluna `created_by_id` (INT FK -> users.id) | `backend/migrate_ticket_creator.py` |
| 2026-08-03 | `support_tickets` | Adicionada coluna `due_date` (TIMESTAMP) | `backend/migrate_ticket_due_date.py` |
| 2026-08-03 | `clients` | Adicionadas colunas `server_ip` (VARCHAR 255) e `server_password` (VARCHAR 500) — visíveis apenas ao SUPER_ADMIN | `backend/migrate_client_server_fields.py` |
| 2026-08-03 | `clients` | Adicionadas colunas `portainer_url`, `portainer_username`, `portainer_password`, `portainer_stack_name`, `portainer_service_name` | `backend/migrate_client_portainer_fields.py` |
| 2026-08-04 | `credentials` | Adicionada coluna `is_superadmin_only` (BOOLEAN DEFAULT FALSE) — restringe visualização ao SUPER_ADMIN | `backend/migrate_credential_superadmin_only.py` |
| 2026-08-04 | `client_attachments` | Criada tabela de anexos/documentos das notas do cliente com `id`, `client_id`, `file_name`, `file_type`, `file_data`, `created_at` | `backend/migrate_client_attachments.py` |
| 2026-08-04 | `clients` | Adicionadas colunas opcionais de contato e endereço (`email`, `phone_whatsapp`, `instagram`, `address`, `city`, `state`) | `backend/add_contact_details_columns.py` |

