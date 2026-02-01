# Project Overview

FiscalZen is designed to streamline and automate fiscal management processes for businesses, ensuring compliance with tax regulations. It benefits businesses large and small by reducing manual compliance tasks and improving efficiency through automated workflows.

## Codebase Reference

> **Detailed Analysis**: For complete symbol counts, architecture layers, and dependency graphs, see [`codebase-map.json`](./codebase-map.json).

## Quick Facts

- Root: `C:\fiscalzen-project`
- Languages: TypeScript (200 files), JavaScript (50 files), Python (30 files)
- Entry: `apps/api/src/index.ts`
- Full analysis: [`codebase-map.json`](./codebase-map.json)

## Entry Points

- [API Server](./apps/api/src/index.ts#L1)
- [Web Application](./apps/web/src/index.tsx#L1)
- [CLI Tool](./packages/cli/src/index.ts#L1)

## Key Exports

- `AbrasfClient` - NFSe client manager
- `SefazClient` - SEFAZ client integration
- `PdfService` - PDF generation and management

## File Structure & Code Organization

- `apps/` — Contains separate applications like API and Web client.
- `packages/` — Reusable packages including clients and utilities.
- `docs/` — Documentation files.
- `tests/` — Automated tests and fixtures.

## Technology Stack Summary

The project primarily uses TypeScript for application logic and interfaces, with Python utilized for specific computational tasks. Node.js is the runtime environment for server-side applications. We employ build tooling such as Webpack and Babel, with ESLint and Prettier configured for code linting and formatting.

## Core Framework Stack

### Backend
- *Express.js*: For server and API handling.
- *TypeORM*: Database operations and ORM.

### Frontend
- *React*: For building user interfaces.

### Data
- *PostgreSQL*: Primary database for structured data storage.

## UI & Interaction Libraries

- *Material-UI*: Used for theming and UI components library with accessibility considerations.

## Development Tools Overview

Key tools include `npm` for package management, `Jest` for testing, and `Docker` for containerization. Refer to [Tooling guide](./tooling.md) for setup details.

## Getting Started Checklist

1. Install dependencies with `npm install`.
2. Start the development server with `npm run dev`.
3. Verify API and web application functionality through provided scripts.
4. Review [Development Workflow](./development-workflow.md) for day-to-day tasks.

## Related Resources

- [architecture.md](./architecture.md)
- [development-workflow.md](./development-workflow.md)
- [tooling.md](./tooling.md)
- [codebase-map.json](./codebase-map.json)
