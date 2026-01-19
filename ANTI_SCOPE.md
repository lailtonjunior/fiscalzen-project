# ANTI_SCOPE - FiscalZen

## O Que Este Projeto NÃO Faz

Este documento lista explicitamente tudo que está **fora do escopo** do FiscalZen.

Se uma funcionalidade não está aqui, não significa que será implementada.
Se não está no CORE_LOGIC.md, também está fora do escopo.

---

## ❌ Emissão de Documentos Fiscais

- **NÃO emite NF-e** (Nota Fiscal Eletrônica)
- **NÃO emite NFS-e** (Nota Fiscal de Serviço)
- **NÃO emite NFC-e** (Nota Fiscal Consumidor)
- **NÃO emite CT-e** (Conhecimento de Transporte)
- **NÃO emite MDF-e** (Manifesto de Documentos)

> Para emissão, use soluções especializadas (ERPs, NFePHP, etc.)

---

## ❌ Interface de Usuário

- **NÃO possui UI web**
- **NÃO possui dashboard**
- **NÃO possui painel administrativo**
- **NÃO possui visualização gráfica de documentos**

> O projeto é uma biblioteca + CLI. UI é responsabilidade do consumidor.

---

## ❌ Cálculos Fiscais

- **NÃO calcula ICMS**
- **NÃO calcula IPI, PIS, COFINS**
- **NÃO interpreta CST/CSOSN**
- **NÃO aplica regras de substituição tributária**

> Cálculo fiscal requer contabilidade especializada.

---

## ❌ Integrações Genéricas

- **NÃO integra com ERPs**
- **NÃO possui API REST pública**
- **NÃO possui webhooks**
- **NÃO possui fila de processamento**
- **NÃO integra com bancos de dados externos**

---

## ❌ Infraestrutura Desnecessária

- **NÃO requer Docker** para uso básico
- **NÃO requer banco de dados** (dados em memória/arquivo)
- **NÃO possui multi-tenancy**
- **NÃO possui autenticação de usuários**
- **NÃO possui logs estruturados para observabilidade**

---

## ❌ Features "Futuras" Prematuras

- **NÃO implementa plugins**
- **NÃO implementa extensões**
- **NÃO implementa abstrações genéricas**
- **NÃO implementa camadas "para o futuro"**

> Código simples > código extensível que ninguém usa.

---

## ❌ Múltiplas UFs/Ambientes Simultâneos

- **NÃO gerencia múltiplos certificados**
- **NÃO gerencia múltiplas empresas**
- **NÃO alterna entre produção/homologação automaticamente**

> Uma execução = um certificado = uma empresa = um ambiente.

---

## Motivo desta Lista

A regra do projeto é clara:

> "Se você não souber justificar algo, exclua."

Este documento existe para que ninguém adicione funcionalidades desnecessárias.
Cada item aqui foi excluído conscientemente.
