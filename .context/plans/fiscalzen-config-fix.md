# Plano: Correção de Configurações FiscalZen

## Visão Geral

Corrigir inconsistências de configuração e padronizar ambiente de desenvolvimento.

## Objetivos

1. Padronizar portas PostgreSQL (5432)
2. Atualizar scripts depreciados
3. Atualizar dependências desatualizadas
4. Criar script de verificação de config

## Escopo

### Incluído
- docker/docker-compose.yml
- apps/api/.env.example
- apps/web/.env.example
- package.json (raiz)
- Criação de scripts/verify-config.mjs

### Excluído
- Lógica de negócio
- Alterações em banco de dados
- Mudanças de arquitetura

## Fases PREVC

### P - Plan (Planejamento)

**Agentes**: @architect-specialist, @backend-specialist

**Tarefas**:
- [ ] Mapear todas as referências de porta PostgreSQL
- [ ] Identificar scripts depreciados
- [ ] Listar dependências desatualizadas
- [ ] Definir padrão de configuração

**Entregáveis**:
- Lista de arquivos a modificar
- Comandos de verificação
- Estimativa de tempo

### R - Review (Revisão)

**Agentes**: @code-reviewer, @security-auditor

**Tarefas**:
- [ ] Revisar plano proposto
- [ ] Validar segurança das mudanças
- [ ] Verificar compatibilidade

**Critérios de Aceitação**:
- Não introduzir breaking changes
- Manter compatibilidade com código existente
- Seguir convenções do projeto

### E - Execute (Execução)

**Agentes**: @feature-developer, @refactoring-specialist

**Tarefas**:

1. **Corrigir Portas**:
   ```yaml
   # docker/docker-compose.yml
   services:
     postgres:
       ports:
         - '5432:5432'  # Alterar de 5433:5432
   ```

2. **Atualizar Script**:
   ```json
   // package.json
   {
     "scripts": {
       "test:integration:init": "cd packages/database && npx cross-env DATABASE_URL=postgresql://fiscalzen_test:fiscalzen_test@localhost:5434/fiscalzen_test drizzle-kit generate && ..."
     }
   }
   ```

3. **Atualizar Dependências**:
   ```bash
   pnpm update drizzle-orm@latest
   pnpm update next@latest
   pnpm update bullmq@latest
   ```

4. **Criar Script de Verificação**:
   ```typescript
   // scripts/verify-config.mjs
   ```

**Entregáveis**:
- Arquivos modificados
- Script verify-config.mjs
- Testes passando

### V - Verify (Verificação)

**Agentes**: @test-writer, @code-reviewer

**Tarefas**:
- [ ] Verificar consistência de portas
- [ ] Testar script de verificação
- [ ] Verificar build
- [ ] Verificar testes

**Comandos**:
```bash
# Verificar portas
grep -r "5433" --include="*.yml" --include="*.yaml" --include="*.env*" .

# Testar script
node scripts/verify-config.mjs

# Build
pnpm build

# Testes
pnpm test
```

### C - Complete (Conclusão)

**Agentes**: @documentation-writer, @devops-specialist

**Tarefas**:
- [ ] Atualizar CHANGELOG.md
- [ ] Criar runbook
- [ ] Atualizar plano
- [ ] Realizar commit

**Mensagem de Commit**:
```
fix(config): padroniza portas e atualiza dependências

- Corrige porta PostgreSQL de 5433 para 5432
- Atualiza script drizzle-kit generate:pg para generate
- Atualiza dependências: drizzle-orm, next, bullmq
- Adiciona script verify-config.mjs

Closes #123
```

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Breaking changes | Baixa | Alto | Testes completos |
| Conflitos de merge | Média | Baixo | Comunicar equipe |
| Ambiente local quebrado | Baixa | Médio | Documentar mudanças |

## Estimativa

- **P (Plan)**: 30 minutos
- **R (Review)**: 30 minutos
- **E (Execute)**: 2 horas
- **V (Verify)**: 1 hora
- **C (Complete)**: 30 minutos

**Total**: 4.5 horas

## Dependências

- Nenhuma dependência externa

## Recursos Necessários

- Acesso ao repositório
- Ambiente de desenvolvimento configurado

## Critérios de Sucesso

- [ ] Todas as portas padronizadas para 5432
- [ ] Script drizzle-kit atualizado
- [ ] Dependências atualizadas sem breaking changes
- [ ] Script verify-config funcionando
- [ ] Todos os testes passando
- [ ] Documentação atualizada

## Decisões Registradas

| Data | Decisão | Responsável |
|------|---------|-------------|
| | | |

## Notas

- Comunicar equipe sobre mudança de porta PostgreSQL
- Atualizar bookmarks de desenvolvedores
- Considerar adicionar ao pre-commit hook
