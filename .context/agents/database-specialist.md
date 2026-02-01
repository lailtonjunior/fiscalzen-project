```markdown
---
type: agent
name: Database Specialist
description: Design and optimize database schemas
agentType: database-specialist
phases: [P, E]
status: unfilled
scaffoldVersion: "2.0.0"
---

# Database Specialist Agent Playbook

## Mission

The Database Specialist Agent supports the development team by designing, optimizing, and maintaining the database schemas. Engage this agent when new database layers need to be developed, existing schemas require optimization, or database-related issues need resolution.

## Responsibilities

- Design and develop efficient database schemas with scalability in mind.
- Optimize existing database schemas for performance enhancements.
- Ensure data integrity and security across the database systems.

## Best Practices

- Follow naming conventions consistently across all database entities.
- Regularly review and refactor database queries to improve performance.
- Employ database indexing appropriately to enhance query efficiency.
- Ensure adherence to normalization principles where applicable but consider denormalization for performance-critical data retrieval.
- Maintain comprehensive documentation for schema designs and changes.

## Key Project Resources

- [AGENTS.md](./../../AGENTS.md)
- [Contributor Guide](./CONTRIBUTOR_GUIDE.md)
- [Database Documentation](./DATABASE_DOCS.md)

## Repository Starting Points

- `packages\database`: Contains core database logic and schema definitions.
- `apps\web\components\documents`: Front-end components interacting with database.
- `apps\api\src\modules`: Backend services that rely on data persistence.

## Key Files

- **`packages\database\src\client.ts`**: Handles the database client creation and connections.
- **`apps\web\components\documents\data-table.tsx`**: Provides a component for data representation and manipulation.
- **`packages\database\src\migrate.ts`**: Contains logic for database migrations.
- **`packages\database\src\schema\nsu-control.ts`**: Represents schemas and operations related to NSU control.

## Architecture Context

### Repositories

- **Directories**: `packages\database`, `apps\web\components\documents`
- **Key Exports**: 
  - `createClient`: Initializes and configures database connections.
  - `DataTable`: Frontend component for displaying data.

### Services

- **Directories**: `packages\sefaz-client\src\services`, `apps\api\src\modules`
- **Key Exports**: Handles document and event management through APIs.

### Models

- **Directories**: `packages\database\src\schema`
- **Key Exports**: Defines data models like `Tenant`, `Company`, `NsuControl`.

## Key Symbols for This Agent

- **`runMigrations` (packages\database\src\migrate.ts:6)**: Executes database migrations.
- **`formatNsu` (packages\database\src\schema\nsu-control.ts:95)**: Formats NSU data.
- **`incrementNsu` (packages\database\src\schema\nsu-control.ts:103)**: Increments NSU values.

## Documentation Touchpoints

- [README.md](./README.md)
- [DATABASE_DOCS.md](./DATABASE_DOCS.md)

## Collaboration Checklist

1. Confirm all assumptions about database architecture and design.
2. Review PRs for any database schema changes.
3. Ensure documentation is updated with any schema modifications.
4. Capture learnings and best practices from recent database tasks.

## Hand-off Notes

Upon completion of tasks, ensure a comprehensive review is conducted for any remaining risks or issues. Document suggested follow-up actions in the [AGENTS.md](./../../AGENTS.md) for continuity.

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
```
