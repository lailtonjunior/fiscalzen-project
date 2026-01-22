# Commit Message Skill Playbook

## When to Use
Use this skill whenever you need to generate commit messages for changes made in the **FiscalZen** project repository. This skill is specifically tailored to produce conventional commit messages that align with the project’s monorepo structure, maintain clarity, and ensure traceability. Engage this skill when committing fixes, features, refactors, documentation updates, or chore and style improvements. Proper commit messages help maintain a clean history and facilitate collaboration across the diverse packages and applications in FiscalZen.

## Instructions
1. Review the staged changes, focusing on which parts of the repository are modified — typical areas include:
   - `packages/sefaz-client` (SOAP client for SEFAZ services)
   - `packages/nfse-client` (municipal NFSe integrations)
   - `apps/api` (backend service and API endpoints)
   - `apps/web` (frontend dashboard and UI components)
   - Other key `packages` like `xml-parser` or `database`
2. Identify the **commit type** from the conventional commit categories used in FiscalZen:
   - `feat`: a new feature or enhancement
   - `fix`: a bug fix
   - `refactor`: code changes that neither add a feature nor fix a bug (improving code structure/quality)
   - `docs`: documentation updates, e.g., in `README.md` or architecture docs
   - `test`: adding or correcting tests
   - `chore`: maintenance tasks such as dependency updates or build tooling changes
   - `style`: code style, formatting, or lint fixes
   - `perf`: performance improvements or optimizations
3. Determine the **scope** reflecting the primary affected package or module. Use exact package names or app names to clarify context. Examples:
   - `sefaz-client`
   - `nfse-client`
   - `api`
   - `web`
   - `xml-parser`
   - `database`
4. Write a concise **description** summarizing the change. Use imperative tense and focus on what the commit accomplishes (the “why” rather than the “how”).
5. Optionally, provide a detailed **body** to explain the motivation or context behind the change if needed.
6. Add an optional **footer** section for:
   - Breaking changes using the `BREAKING CHANGE:` prefix.
   - Issue references in the format `Closes #<issue-number>` if applicable.
7. Ensure the subject line is under 72 characters and omit trailing punctuation.
8. Structure the commit message in this format:
   ```
   <type>(<scope>): <description>

   [optional body]

   [optional footer]
   ```

## Examples
```plaintext
feat(sefaz-client): add OAuth2 authentication for SEFAZ service access

Add support for OAuth2 flows to authenticate with SEFAZ endpoints,
replacing legacy certificate-based login.

Closes #214
```

```plaintext
fix(api): resolve timeout error during payment gateway requests

The previous timeout settings were too low causing intermittent failures.
Increased timeout duration to handle slower gateway responses reliably.
```

```plaintext
refactor(nfse-client): simplify municipality data scraper logic

Extract common scraping utilities and remove redundant retries.
Improves maintainability and reduces flaky scraping errors in `rpa` module.
```

```plaintext
docs(readme): update local database setup instructions

Clarified PostgreSQL version requirements and added sample `.env` values.
```

```plaintext
chore(web): upgrade Next.js to v14.1.2

Includes security patches and performance improvements.
BREAKING CHANGE: Remove deprecated API methods related to routing.
```

## Guidelines
- **Use imperative mood**: phrases like "add", "fix", "update", never "added" or "fixes".
- **Keep the subject line ≤ 72 characters** for readability in logs and PRs.
- **Avoid trailing periods** or punctuation in the subject line.
- **Capitalize first letter** of the description.
- **Separate the subject from the optional body with a blank line.**
- **Explain "why" in the body** rather than "what" was changed to give reviewers useful context.
- **Always reference issues or tasks when possible** for better traceability (e.g., `Closes #123`).
- Align **scope names exactly to package or application folders** for clarity (e.g., `sefaz-client`, `xml-parser`, `api`).
- For **breaking changes**, use the footer section with `BREAKING CHANGE:` keyword.
- Follow the **monorepo conventions** and use consistent types and scopes so automated release tools and changelog generators can parse messages correctly.
- When uncertain about scope, pick the highest-impact package or directory clearly affected.
- Prefer **conciseness and clarity** over verbosity.

---

This playbook ensures that commit messages across the FiscalZen project remain consistent, clear, and meaningful for developers, reviewers, and automated release systems, greatly enhancing overall maintainability and collaboration.
