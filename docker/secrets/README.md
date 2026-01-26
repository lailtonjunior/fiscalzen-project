# Docker Secrets

Este diretório contém os arquivos de secrets para o Docker Compose.

## Arquivos necessários

Crie os seguintes arquivos com os valores apropriados:

| Arquivo | Descrição |
|---------|-----------|
| `postgres_password.txt` | Senha do PostgreSQL |
| `redis_password.txt` | Senha do Redis |
| `meilisearch_key.txt` | Master key do Meilisearch |
| `minio_user.txt` | Usuário root do MinIO |
| `minio_password.txt` | Senha root do MinIO |
| `jwt_secret.txt` | Secret para JWT (min 32 chars) |
| `cert_encryption_key.txt` | Chave para criptografia de certificados (base64) |

## Segurança

- **NUNCA** commite estes arquivos no git
- Use senhas fortes em produção
- Considere usar um gerenciador de secrets (Vault, AWS Secrets Manager) em produção

## Geração de secrets seguros

```bash
# Gerar senha aleatória
openssl rand -base64 32 > postgres_password.txt

# Gerar chave de criptografia
openssl rand -base64 32 > cert_encryption_key.txt
```
