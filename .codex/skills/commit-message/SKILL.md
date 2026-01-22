---
name: Commit Message Generator
description: Gera mensagens de commit convencionais seguindo padrões do projeto
---

# Commit Message Generator

## When to Use
Use this skill when creating commit messages or when the user asks to commit changes, specifically tailored for the FiscalZen project. This skill generates conventional commit messages that adhere to the project's conventions, ensuring clarity and traceability.

## Instructions
1. Analyze staged changes with `git diff --staged` to understand alterations made.
2. Identify the change type: choose from **feat**, **fix**, **refactor**, **docs**, **test**, **chore**, **style**, or **perf**.
3. Determine the scope from the most significantly altered directory or module, such as `sefaz-client`, `nfse-client`, or `api`.
4. Compose a concise message focusing on the "why" of the changes, not just the "what".

## Format
```
<type>(<scope>): <description>

[optional body explaining why, not what]

[optional footer: BREAKING CHANGE, Closes #issue]
```

## Examples
- `feat(sefaz-client): implement OAuth2 authentication for SEFAZ access`
- `fix(api): resolve timeout error during payment gateway calls`
- `refactor(nfse-client): simplify the municipality data scraper logic`
- `docs(readme): update setup instructions for the local database`

## Guidelines
- Keep the subject line under 72 characters.
- Use imperative mood (e.g., "add" instead of "added").
- Avoid ending the subject with a period.
- Separate the subject from the body with a blank line.
- If applicable, include a footer for breaking changes or issue references, like `Closes #123` for linked issues.