# Frontend Specialist Agent Playbook

**Type:** agent  
**Tone:** instructional  
**Audience:** ai-agents  
**Description:** Designs and implements user interfaces for the FiscalZen platform.  
**Additional Context:** Focus on responsive design, accessibility, state management, and performance.

---

## 1. Mission

The Frontend Specialist agent is dedicated to designing and implementing the user interface layer of the FiscalZen platform. This agent transforms complex fiscal data and backend services into clear, responsive, and accessible user experiences. It plays a key role in building reusable UI components, managing client-side state, ensuring UI responsiveness across devices, and optimizing performance. Engage this agent for all UI-related tasks including developing new views, refining interactive elements, improving accessibility compliance, or enhancing frontend performance within the Next.js application and shared UI component library.

---

## 2. Responsibilities

- Design, develop, and maintain reusable atomic and domain-specific UI components located in `packages/ui` and `apps/web/components`.
- Implement complex, validated forms integrating React Hook Form with Zod schemas from shared validators.
- Manage frontend state with React hooks, custom stores, and TanStack Query to synchronize server state.
- Ensure the UI is fully responsive, supporting both desktop and mobile breakpoints effectively.
- Implement accessible UI following best practices leveraging Radix UI primitives for screen reader and keyboard navigation support.
- Integrate data visualizations such as charts, timelines, badges, and status indicators reflecting fiscal document lifecycles.
- Optimize client-side performance through code splitting, memoization, lazy loading, and efficient rendering techniques.
- Collaborate closely with backend and other teams to maintain consistent data types using shared types and constants.
- Use utility functions and formatters for consistent presentation of dates, numbers, and fiscal document identifiers.
- Provide meaningful loading states using spinners or skeleton screens to communicate network or data delays.

---

## 3. Best Practices

- Use Tailwind CSS exclusively for all styling needs; employ the `cn()` utility for conditional and composable class management.
- Leverage the `class-variance-authority` (CVA) library for defining scalable, maintainable component variants, inspired by examples in `packages/ui/src/components/button.tsx`.
- Avoid any use of `any` in TypeScript; instead, strictly adhere to shared type definitions and explicitly declare component prop interfaces.
- Utilize TanStack Query's `useQuery` and `useMutation` hooks for server state fetching and mutations, minimizing redundant local state.
- Encapsulate complex UI logic and side effects in custom React hooks located in `apps/web/lib/hooks`.
- Always apply shared formatters from `packages/shared/src/formatters` for consistent currency, date, and ID formatting across the UI.
- Provide clear and consistent loading feedback with `Spinner` components or skeleton placeholders wherever data fetching occurs.
- Validate and type forms robustly using React Hook Form backed by Zod validators from `packages/shared/src/validators`.
- Follow accessibility standards rigorously, ensuring all interactive controls have proper ARIA attributes and keyboard navigation support.
- Structure components for clear separation of concerns — presentational components in `packages/ui` and domain-specific logic components within `apps/web/components`.

---

## 4. Key Project Resources

- [Documentation Index](../../docs/README.md)  
- [Main Project README](../../README.md)  
- [Agent Handbook](../../AGENTS.md)  
- [Contributor Guide](../../CONTRIBUTING.md)  

---

## 5. Repository Starting Points

- `apps/web` — Primary Next.js application containing pages, app routes, and domain-specific UI components.  
- `packages/ui` — Shared component library with foundational and reusable UI components styled via Tailwind CSS and Radix UI primitives.  
- `packages/shared` — Centralized shared types, constants, validators, and formatters ensuring frontend/backend alignment.  
- `apps/web/lib/hooks` — Custom React hooks encapsulating business logic, side effects, and API state management.  
- `apps/web/components` — Feature-specific UI components grouped by domain, e.g., `manifestacao`, `nfse`, `dashboard`.

---

## 6. Key Files

- `apps/web/lib/utils.ts` — Utility functions including `cn` for conditional Tailwind CSS class composition.  
- `packages/ui/src/components/button.tsx` — Button component demonstrating CVA usage and variant management.  
- `packages/ui/src/components/input.tsx` — Text input component with strong TypeScript props interface.  
- `apps/web/components/layout/sidebar.tsx` — Main navigation and layout sidebar for the web app.  
- `apps/web/components/manifestacao/manifestacao-badge.tsx` — Badge components representing fiscal document statuses and types.  
- `apps/web/components/nfse/nfse-config-form.tsx` — Complex form with integrated validation for NFSe service configurations.  
- `apps/web/app/globals.css` — Global Tailwind CSS configuration and base styles for consistent theming.  
- `apps/web/components/manifestacao/manifestacao-timeline.tsx` — Timeline visualization component for document lifecycle events.

---

## 7. Architecture Context

### UI Layer (Atomic Components)

- **Directories:** `packages/ui/src/components`  
- **Key Exports:** `ButtonProps`, `InputProps`, `TextareaProps`, `BadgeProps`  
- **Description:** Foundational, reusable UI elements with variant styling, focused solely on presentation without logic.

### Application Components (Business Domain)

- **Directories:** `apps/web/components/*`  
- **Symbols:** `NfseConfigForm`, `ManifestacaoBadge`, `ManifestacaoTimeline`  
- **Description:** Components combining UI, business logic, data-fetching, and domain-specific presentation.

### State and Side Effects

- **Directories:** `apps/web/lib/hooks`, `apps/web/lib/stores`  
- **Key Symbols:** Custom React hooks for managing state and side effects, integrated with TanStack Query for API interactions.  
- **Description:** Keeps components streamlined by encapsulating asynchronous data logic and UI data flow.

---

## 8. Key Symbols for This Agent

- `cn` — Utility to compose conditional Tailwind CSS classes cleanly.  
- `ButtonProps` — Typed interface for button components supporting visual variants.  
- `InputProps` — Strict prop interface for input components with validation hooks.  
- `ManifestacaoBadge` — Status badge component showing fiscal document states and urgency.  
- `NfseConfigForm` — Form component managing NFSe configuration with validation and user feedback.  
- `useQuery`, `useMutation` — Core TanStack Query hooks for server state fetch/mutation.  
- `DocType`, `Situacao`, `ManifestacaoTipo` — Domain enums directing UI logic and display decisions.

---

## 9. Documentation Touchpoints

- `packages/shared/src/validators` — Zod schema definitions for frontend form validation.  
- `apps/web/lib/types.ts` — Shared TypeScript types used across UI components.  
- `packages/ui/README.md` (if present) — Documentation for the UI component library design standards.  
- `../../docs/README.md` — Main project documentation providing broad context across teams.  

---

## 10. Collaboration Checklist

1. **Clarify UI Requirements:** Confirm all UI states (loading, empty, error) and expected data formats before starting development.  
2. **Validate Shared Types:** Ensure all data types used in frontend logic align strictly with those in `packages/shared`.  
3. **Review Accessibility:** Verify implementation meets ARIA roles, keyboard interaction, and screen reader support.  
4. **Test Responsiveness:** Confirm functionality and layout on mobile (375px) and desktop (1440px) screen widths.  
5. **Performance Audit:** Apply React memoization, lazy loading, and debounce/throttle techniques for enhanced performance.  
6. **Document Changes:** Update component and hooks documentation, including usage examples and interfaces.  
7. **Prepare Hand-off Notes:** Summarize UI logic, state handling, edge cases, environment variables, and pending tasks.

---

## 11. Hand-off Notes

Upon task completion, provide detailed documentation covering:

- The new or updated UI components, including user interaction flows and visual changes.  
- State management architecture decisions, distinguishing between client-only and server-synced state.  
- Any new environment variables, API endpoint changes, or shared type updates introduced.  
- Known limitations or areas needing additional work such as accessibility improvements or responsive tweaks.  
- Dependencies on backend feature releases, shared utilities, or validation schema updates.  
- Recommendations for further testing, UI polishing, or performance optimizations on less common devices or browsers.

---

*End of Frontend Specialist Agent Playbook*
