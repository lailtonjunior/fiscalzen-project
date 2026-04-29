---
description: Gera uma fixture XML SEFAZ sanitizada para uso em testes
argument-hint: "<tipo> <cenário>  —  ex: 'nfe autorizada', 'cte desacordo', 'nfe cancelada', 'mdfe autorizada', 'nfe resumo'"
---

Delegue ao subagent `sefaz-xml-specialist`.

Parâmetros: **$ARGUMENTS**

Parse esperado:
- `<tipo>`: `nfe` (55), `cte` (57), `mdfe` (58), `nfse` (municipal).
- `<cenário>`: `autorizada | cancelada | carta-correcao | resumo | desacordo | invalida-schema | invalida-assinatura | gzip-corrompido | base64-quebrado`.

O `sefaz-xml-specialist` deve:

1. Criar/atualizar o arquivo em:
   ```
   tests/fixtures/sefaz/<tipo>/<cenario>.xml
   ```
2. Atualizar (ou criar) `tests/fixtures/sefaz/<tipo>/README.md` documentando o cenário: o que testa, quais campos-chave, limitações.
3. **Sanitização absoluta:**
   - CNPJs sintéticos (`00000000000000`, `11111111111111`, `99999999999999`).
   - Nomes/razões sociais claramente fictícios (`EMPRESA TESTE LTDA`, `DESTINATARIO FICTICIO S/A`).
   - Endereços fictícios (`RUA DE TESTE 123`).
   - Chaves de acesso com padrão de teste (aAno + aUF + CNPJ sintético + mod + série + número + cNF + cDV, tudo consistente).
   - Assinatura xmldsig substituída por bloco placeholder válido estruturalmente mas sem vínculo com certificado real.
4. **Nunca** incluir certificado real ou hash derivado de certificado real.
5. Se o cenário for `autorizada`, incluir `<protNFe>` com `cStat=100`, `xMotivo="Autorizado o uso da NF-e"`.
6. Se for `cancelada`, incluir `<procEventoNFe>` com evento 110111 consistente.
7. Se for `resumo`, usar `<resNFe>` apenas com metadados (sem valor total, sem itens).
8. Se for inválido (`invalida-schema`, etc.), produzir falha determinística e descrever no README o que deve quebrar no parser.

9. Registrar uso sugerido em teste:
   ```ts
   import { readFileSync } from "node:fs";
   const xml = readFileSync(
     "tests/fixtures/sefaz/nfe/autorizada.xml",
     "utf-8"
   );
   ```

Regra: se a fixture já existe, não sobrescrever. Criar variante com sufixo numérico (`autorizada-2.xml`) e justificar a diferença no README.
