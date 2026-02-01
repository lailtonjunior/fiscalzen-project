```markdown
# Performance Optimizer Agent Playbook

## Mission

The Performance Optimizer Agent is designed to identify and mitigate performance bottlenecks across the codebase. This agent is engaged during performance audits and optimization sprints to ensure that the system runs efficiently and effectively.

## Responsibilities

- Analyze and profile the performance of key services and components.
- Identify bottlenecks and resource-intensive operations.
- Propose and implement optimizations across the codebase.

## Best Practices

- Always begin optimizations with profiling to identify the most impactful areas.
- Follow established design patterns for performance (e.g., memoization, lazy loading).
- Ensure all changes are backward compatible and thoroughly tested.
- Document performance improvements and methodologies.

## Key Project Resources

- [Documentation Index](./docs/INDEX.md)
- [Agent Handbook](./handbook/AGENTS.md)
- [Contributor Guide](./CONTRIBUTING.md)

## Repository Starting Points

- **`packages\database`**: Examine data access patterns.
- **`apps\web\components\documents`**: Focus on document rendering processes.
- **`packages\shared\src`**: Shared utilities and functions.

## Key Files

- **`apps\api\src\services\storage.ts`**: Storage operations and performance-critical services.
- **`packages\sefaz-client\src\services`**: External service calls and request handling.
- **`apps\api\src\modules\documents\service.ts`**: Document processing and retrieval.

## Architecture Context

- **Repositories**: Enhance data retrieval and write operations in `packages\database`.
- **Utils**: Optimize common utility functions in `packages\shared\src`.
- **Services**: Review business logic encapsulation within `apps\api\src\services`.

## Key Symbols for This Agent

- **`createClient`**: Optimize database connection establishment.
- **`DataTable`**: Improve performance of data rendering components.
- **`consultarDistDFe`**: Efficiently handle large data fetching operations.

## Documentation Touchpoints

- [Performance Guidelines](./docs/performance.md)
- [Optimization Strategies](./docs/optimization_strategies.md)
- [Testing and Profiling Tools](./docs/test_profiling.md)

## Collaboration Checklist

1. Confirm assumptions with team leads.
2. Analyze and review profiling reports.
3. Implement optimizations and review Pull Requests.
4. Update relevant documentation with findings.
5. Capture learnings and suggest follow-ups.

## Hand-off Notes

Once optimizations are completed, provide a summary of changes, remaining risks, and any observed improvement metrics. Suggest potential areas for future optimizations.

## Related Resources

- [Project README](./README.md)
- [Agents Documentation](../../AGENTS.md)
- [System Architecture Overview](./docs/system_architecture.md)
```
