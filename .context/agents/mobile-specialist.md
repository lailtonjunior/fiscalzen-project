```markdown
# Mobile Specialist Agent Playbook

## Mission

The Mobile Specialist Agent is responsible for developing and maintaining native and cross-platform mobile applications within the FiscalZen project. Engage this agent whenever mobile-specific expertise is required, particularly in areas of user interface, performance optimization, and platform-specific implementations.

## Responsibilities

- Develop and implement mobile features using best practices.
- Ensure cross-platform compatibility for various devices.
- Maintain the mobile codebase, including updates and bug fixes.
- Optimize mobile applications for maximum speed and scalability.

## Best Practices

- Follow consistent naming conventions across components and services.
- Ensure UI components are responsive and adaptive.
- Leverage shared utilities and helper functions from the `packages/shared/src`.
- Adhere to the established architectural patterns in service and component layers.
- Write unit tests for each new feature or module.

## Key Project Resources

- [Documentation Index](../docs/README.md)
- [Agent Handbook](../../AGENTS.md)
- [Contributor Guide](./README.md)

## Repository Starting Points

- **`apps\web\app`**: Contains the main entry points for mobile-related UI components.
- **`packages\ui\src\components`**: Houses reusable UI components.
- **`packages\shared\src`**: Includes shared utilities and helper functions applicable to mobile development.

## Key Files

- **`apps\web\components\manifestacao\manifestacao-modal.tsx`**: Modal component for manifestacao interactions.
- **`apps\web\components\nfse\edit-nfse-dialog.tsx`**: Dialog component for editing NFSe.
- **`packages\ui\src\components\button.tsx`**: Defines the button UI component.

## Architecture Context

- **Utils Layer**: Centralized in `packages/shared/src`, containing shared utilities like `createParser` and `parseDate` for data manipulation.
- **Services Layer**: Structured around encapsulating business logic, such as `consultarDistDFe` in the `services` folder.
- **Components Layer**: Focuses on UI components, with a significant number of exports like `ErrorBoundary` and `ButtonProps`.

## Key Symbols for This Agent

- **`ButtonProps`**: Exported from `packages/ui/src/components/button.tsx`.
- **`MunicipioSelector`**: Exported from `apps/web/components/nfse/municipio-selector.tsx`.
- **`MobileNavProps`**: Defines navigation properties for mobile layouts.

## Documentation Touchpoints

- [README.md](./README.md): General steps for setting up and contributing to the project.
- [Agent Guidelines](../../AGENTS.md): Detailed instructions for agents within the project.
- [Documentation Index](../docs/README.md): Comprehensive index of project documentation.

## Collaboration Checklist

1. Confirm understanding of requirements for new mobile features.
2. Review and merge Pull Requests related to mobile changes.
3. Update documentation after implementing new features or fixes.
4. Capture learnings and insights to improve future mobile development processes.

## Hand-off Notes

Upon completing tasks, ensure all code is committed and pushed. Document any remaining risks or follow-up actions necessary for continued mobile project success. Consider conducting a code review meeting to discuss potential improvements.

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
```
