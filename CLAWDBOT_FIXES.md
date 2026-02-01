# Lista de Correções e Melhorias para Clawdbot

**Prioridade: Alta** (Itens que geram risco ou erro)

## 1. Segurança e Estabilidade 🛑
*   **Chain of Trust (Cadeia de Certificação):** O serviço `CertificateValidationService` verifica apenas a data de validade. **Falta validar a cadeia da autoridade certificadora (ICP-Brasil) e revogação (LCR/OCSP).** Sem isso, um certificado revogado (mas não expirado) continua sendo aceito.
*   **Proteção de Tipagem:** Remover o uso excessivo de `as any` no `DocumentsService`. Isso está mascarando erros de *schema drift* entre o código e o banco de dados. Se o banco mudar, a API vai quebrar silenciosamente em runtime.
*   **Segredos nos Logs:** Verificar se `console.log` em arquivos de configuração (`redis.ts`) não está vazando credenciais. Substituir por logger redigido.

## 2. Performance e Escalabilidade ⚠️
*   **Bloqueio de Event Loop:** O parsing de XML (`parseNFe`) está rodando na thread principal. Em carga alta (ex: processando 1000 XMLs), isso vai travar a API e derrubar requests de healthcheck. **Solução:** Mover para Worker Threads.
*   **Dashboard Lento:** A rota `/dashboard/summary` faz `COUNT(*)` em tabelas grandes a cada F5 do usuário. **Solução:** Implementar cache (Redis) de 5-10 minutos.

## 3. Manutenibilidade 🧹
*   **Documentação Fantasma:** Preencher os 22 arquivos vazios na pasta `.context/`. O agente não consegue seguir padrões se eles não estão documentados.
*   **Logs Não Estruturados:** Trocar `console.log` por `logger.info/error` (Pino) para permitir análise em ferramentas de observabilidade (Datadog/CloudWatch).

## Resumo da Ação Necessária
O trabalho recente no monitor de certificados foi bom, mas incompleto na parte de segurança (revogação). O foco agora deve ser **blindar a aplicação** (tipagem, validação real) antes de adicionar novas features.
