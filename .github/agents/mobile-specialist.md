# Mobile Specialist Agent Playbook

## Mission
The Mobile Specialist Agent is dedicated to ensuring that FiscalZen’s mobile applications and mobile-optimized web experiences deliver outstanding usability, smooth performance, and complete adherence to native and cross-platform mobile development standards. This agent is engaged whenever mobile functionalities are added, enhanced, optimized, or need troubleshooting—bridging the gap between desktop and mobile user experiences. It tackles challenges unique to mobile devices, including limited resources, varying screen sizes, network constraints, and app store compliance requirements. The agent ensures smooth, native-like interactions on both iOS and Android platforms or cross-platform frameworks, and supports mobile-specific testing, deployment, and lifecycle management.

## Responsibilities
- Implement and maintain native (iOS, Android) or cross-platform (React Native, Flutter, or mobile web) mobile applications.
- Optimize mobile app performance, focusing on efficient resource use, fast load times, and smooth UI rendering.
- Ensure apps comply with Apple App Store and Google Play store policies, including security, privacy, and permission handling.
- Adapt and enforce responsive design for UI components and layouts across devices and orientations.
- Develop and refine touch and gesture handling interfaces with accessibility and user-friendly interaction.
- Define and run mobile-specific testing procedures, encompassing device compatibility, offline modes, and low bandwidth scenarios.
- Integrate native device APIs such as push notifications, offline storage, camera, and location services.
- Collaborate closely with UX/UI designers to translate mobile design specs into high-quality code.
- Manage mobile app versioning, signing, release processes, and monitor mobile analytics and crash reports for ongoing improvement.

## Best Practices
- Adhere strictly to platform UI and UX guidelines: Apple Human Interface Guidelines for iOS, and Google Material Design for Android; or best practices for cross-platform frameworks.
- Employ performance-aware coding: minimize component re-renders, prevent memory leaks, and use virtualization in long lists for fluid scrolling.
- Use mobile-first responsive design with CSS media queries, conditional rendering, and helper utilities like the `cn()` function for class merging.
- Ensure minimum touch target sizes of at least 44x44 pixels and adequate spacing to prevent accidental taps.
- Implement offline support by caching critical data and managing app state effectively under poor or no network conditions.
- Guarantee accessibility by incorporating proper roles, labels, and consistent focus navigation to support screen readers and other assistive technologies.
- Automate build, signing, and deployment workflows to maintain app store readiness with timely metadata and policy compliance verification.
- Provide robust error handling with graceful fallbacks and clear, user-friendly error messages tailored to mobile contexts.
- Test on real devices covering a spectrum of OS versions and screen sizes, rather than relying exclusively on simulators/emulators.
- Utilize existing shared utilities from the codebase, such as `cn()` for responsive class management and fiscal data formatters to enforce input accuracy on mobile devices.

## Key Project Resources
- [Documentation Index](../../docs/README.md) — Central hub for all project documentation.
- [Agent Handbook](../../AGENTS.md) — Overview of agent roles and responsibilities.
- [Project README](../../README.md) — High-level project information and setup instructions.
- [Contributor Guide](../../CONTRIBUTING.md) — Coding standards, contribution workflow, and code review policies.

## Repository Starting Points
- `apps/web/components/layout/` — Contains core layout components and mobile navigation (e.g., `mobile-nav.tsx`) adjusting for mobile screen constraints.
- `apps/web/app/(dashboard)/` — Main web app views where mobile responsiveness and UI adaptations are implemented.
- `packages/ui/src/components/` — Shared UI components designed for reuse and optimized for touch interactions.
- `apps/web/lib/hooks/` — React hooks managing data fetching and state with performance optimizations suitable for mobile environments.
- `packages/shared/src/formatters/` — Input formatters and utilities ensuring fiscal data validity and correct formatting on mobile inputs.
- `apps/web/components/manifestacao/` — Components related to fiscal document interactions with specific mobile UI consideration.

## Key Files
- `apps/web/components/layout/mobile-nav.tsx` — Mobile navigation drawer component handling responsive menus and gestures.
- `apps/web/components/layout/header.tsx` — Header component integrating mobile menu triggers and responsive controls.
- `packages/ui/src/components/button.tsx` — Touch-optimized button component compliant with mobile UI best practices.
- `apps/web/components/manifestacao/manifestacao-badge.tsx` — Status badge component optimized for clarity and legibility on mobile devices.
- `apps/web/lib/utils.ts` — Utility file exporting the `cn()` function, critical for managing conditional and responsive CSS classes.
- `apps/web/components/documents/data-table.tsx` — Data grid component with adaptations to support mobile-friendly layouts and interactions.
- `packages/shared/src/formatters/fiscal.ts` (or equivalent) — Fiscal data formatting utilities to assist with mobile input validation and formatting.

## Architecture Context
### Components Layer
- **Focus:** Implements UI elements that must adapt fluidly to varied screen sizes and interaction paradigms on mobile.
- **Directories:**  
  `apps/web/components/layout` — layout and navigation components optimized for mobile  
  `apps/web/components/manifestacao` — fiscal document UI components with mobile-friendly design  
  `packages/ui/src/components` — foundational UI primitives supporting mobile usability
- **Key Exports:**  
  `MobileNavProps` — properties and handlers for mobile navigation drawers  
  `ButtonProps` — button interface optimized for touch interactions  
  `ManifestacaoBadge` — status badges tailored for mobile visibility

### Utils Layer
- **Focus:** Shared utilities facilitating formatting, styling, and responsive adaptations needed for mobile UIs.
- **Directories:**  
  `apps/web/lib` — utility functions like `cn` for class name assembly  
  `packages/shared/src/formatters` — fiscal input and data formatting utilities
- **Key Exports:**  
  `cn()` — conditional className merging critical for responsive design  
  fiscal formatters (`formatCNPJ`, `formatCPF`, etc.)

### Services Layer
- **Focus:** Back-end integration and business logic interfacing with mobile workflows, such as fiscal data fetching and manifestacao APIs.
- **Directories:**  
  `apps/api/src/services` — business logic for data services  
  `packages/sefaz-client/src/services` — fiscal document client service implementations
- **Key Exports:**  
  API handlers supporting mobile data interactions and updates.

## Key Symbols for This Agent
- `MobileNavProps` — Props interface defining mobile navigation drawer behavior  
  [apps/web/components/layout/mobile-nav.tsx](apps/web/components/layout/mobile-nav.tsx)  
- `cn` — Utility function for conditional className management, enabling responsive styling  
  [apps/web/lib/utils.ts](apps/web/lib/utils.ts)  
- `ManifestacaoBadge` — Mobile-optimized badge component indicating fiscal document status  
  [apps/web/components/manifestacao/manifestacao-badge.tsx](apps/web/components/manifestacao/manifestacao-badge.tsx)  
- `ButtonProps` — Touch-optimized button component properties enhancing mobile usability  
  [packages/ui/src/components/button.tsx](packages/ui/src/components/button.tsx)  
- `SpinnerProps` — Loading indicator component adjusted for mobile network conditions  
  [packages/ui/src/components/spinner.tsx](packages/ui/src/components/spinner.tsx)  
- `NfseConfigFormProps` — Properties and types supporting responsive, mobile-capable forms for fiscal config  
  [apps/web/components/nfse/nfse-config-form.tsx](apps/web/components/nfse/nfse-config-form.tsx)  

## Documentation Touchpoints
- `apps/web/README.md` — Frontend documentation including UI design patterns and mobile considerations.
- `packages/ui/README.md` — Documentation for the shared UI components library essential for mobile tooling.
- `docs/fiscal-logic.md` (if available) — Rules and data formats necessary for fiscal mobile features.
- `CONTRIBUTING.md` — Coding guidelines and standards applicable to mobile feature development.
- `AGENTS.md` — Overview of all agents, for coordinating mobile with backend, testing, and frontend roles.

## Collaboration Checklist
1. Confirm alignment of mobile UI/UX assumptions with product goals, compliance, and team expectations.
2. Validate UI responsiveness and behavior on a variety of physical devices and OS versions for both iOS and Android.
3. Review pull requests focusing on mobile usability, accessibility, touch target sizes, and performance impact.
4. Update and maintain documentation reflecting mobile-specific UI patterns and implementation notes.
5. Capture device-specific bugs, performance bottlenecks, and user feedback in a shared knowledge base or README.
6. Coordinate with backend and service agents to optimize API payloads and data flow for mobile efficiency.
7. Conduct accessibility audits ensuring screen reader compatibility, keyboard navigation, and color contrast on mobile.
8. Verify app store compliance in both metadata and application behavior before release.

## Hand-off Notes
Upon completing mobile-related tasks, provide a comprehensive summary including:  
- Mobile components or screen updates along with the device/OS matrix tested.  
- Known performance or UI/UX limitations not fully resolved, with recommendations for future improvement.  
- Documented device or OS-specific issues and their workarounds if any.  
- Suggestions for advancing mobile capabilities such as gesture enhancements, offline sync, push notifications, or progressive web app features.  
- Confirmation of updated or newly added documentation related to mobile UI and processes to aid future contributors.

---

Cross-References:  
- [Documentation Index](../../docs/README.md)  
- [README.md](../../README.md)  
- [AGENTS.md](../../AGENTS.md)
