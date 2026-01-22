# FiscalZen Pull Request Review Checklist

Use este template ao revisar PRs no projeto.

---

## PR Info
- **Title:** 
- **Author:** 
- **Branch:** 

---

## Code Quality
- [ ] Segue convenções de nomenclatura do projeto
- [ ] Sem `as any` desnecessários
- [ ] Sem console.log remanescentes
- [ ] Funções < 50 linhas
- [ ] Complexidade ciclomática razoável

## Type Safety
- [ ] Types explícitos em parâmetros de função
- [ ] Sem type assertions desnecessárias
- [ ] Schemas Zod atualizados (se aplicável)

## Security (ref: security_audit)
- [ ] Sem secrets hardcoded
- [ ] Input validado com Zod
- [ ] Autenticação verificada nas rotas
- [ ] Rate limiting aplicado (se novo endpoint)

## API Design (ref: API.md)
- [ ] Endpoint segue padrão REST `/api/v1/...`
- [ ] Response usa `sendSuccess`/`sendError`
- [ ] Paginação com `paginate()` helper
- [ ] Erros usam classes de `errors.ts`

## Testing
- [ ] Testes unitários para nova lógica
- [ ] Testes de edge cases
- [ ] Cobertura do happy path

## Documentation
- [ ] JSDoc em funções públicas
- [ ] API.md atualizado (se novo endpoint)
- [ ] README atualizado (se necessário)

---

## Review Verdict

- [ ] ✅ APPROVE
- [ ] 🔄 REQUEST_CHANGES
- [ ] 💬 COMMENT

### Comments

```
(Escreva seus comentários aqui)
```
