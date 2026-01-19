# Frontend Specialist Agent Playbook

## Mission
The Frontend Specialist agent is responsible for architecting, implementing, and maintaining the user interface and client-side logic of the FiscalZen platform. Its primary focus is creating a high-performance, accessible, and type-safe experience for managing fiscal documents, manifestations, and company configurations.

## Core Expertise
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS with `class-variance-authority` (CVA)
- **UI Components:** Radix UI primitives and Shadcn UI patterns
- **State Management:** TanStack Query (React Query) for server state and React Hooks for local state
- **Form Handling:** React Hook Form with Zod validation
- **Data Fetching:** Typed API clients and custom hooks located in `apps/web/lib/hooks`

## Key Directories & File Purposes

### 1. Applications & Packages
- `apps/web`: The main Next.js application.
  - `/app`: App Router pages and layouts.
  - `/components`: Domain-specific UI components (dashboard, documents, manifestação).
  - `/lib/hooks`: Custom hooks for data fetching and business logic.
  - `/lib/stores`: Client-side state management.
- `packages/ui`: Shared design system and base components.
  - `/src/components`: Atomic components (Button, Input, Badge, etc.).
  - `/src/lib/utils.ts`: Tailwind merging utility (`cn`).
- `packages/shared`: Shared types, constants, and validators used across frontend and backend.

### 2. Critical UI Components
- `apps/web/components/layout/`: Navigation, Sidebar, and Header.
- `apps/web/components/manifestacao/`: Specialized components for SEFAZ manifestation (badges, timelines, modals).
- `apps/web/components/nfse/`: Configuration forms and selectors for NFSe.
- `apps/web/components/dashboard/`: Charts and stat cards.

## Common Workflows

### Workflow 1: Creating a New Feature Component
1. **Analyze Requirements**: Check if the component belongs in `packages/ui` (generic) or `apps/web/components` (domain-specific).
2. **Define Props**: Use TypeScript interfaces, extending standard HTML attributes when applicable (e.g., `React.InputHTMLAttributes<HTMLInputElement>`).
3. **Styling**: Use Tailwind CSS. For components with variants, use `cva` (see `packages/ui/src/components/button.tsx`).
4. **Composition**: Utilize the `cn` utility from `@/lib/utils` or `@fiscalzen/ui/lib/utils` to merge classes.
5. **Accessibility**: Ensure Radix UI primitives are used for complex interactions (Modals, Dropdowns).

### Workflow 2: Implementing Data-Driven Views
1. **Define Schema**: Locate or create the Zod schema in `packages/shared/src/validators`.
2. **Create Hook**: Implement a custom hook in `apps/web/lib/hooks/` using TanStack Query.
   - Use `useQuery` for fetching.
   - Use `useMutation` for actions (create, update, delete).
3. **Handle States**: Implement Loading (use `Spinner` or Skeletons) and Error states.
4. **Display Data**: Use formatters from `packages/shared/src/formatters` for dates, currency, and CNPJ/CPF.

### Workflow 3: Form Implementation
1. **Schema**: Use Zod for client-side validation.
2. **Setup**: Initialize `useForm` with the `zodResolver`.
3. **UI**: Use the form components from `packages/ui/src/components/form.tsx`.
4. **Submission**: Connect the form `onSubmit` to a mutation hook.

## Best Practices & Conventions

### Styling & UI
- **Utility First**: Always prefer Tailwind utility classes over CSS modules or inline styles.
- **Color Tokens**: Use CSS variables (e.g., `text-muted-foreground`, `bg-primary`) defined in the theme to support dark mode.
- **Conditional Classes**: Always use the `cn(...)` utility: `className={cn("base-class", condition && "active-class", className)}`.
- **Icons**: Use `lucide-react` for all iconography.

### State & Data
- **Server State**: Keep API data in TanStack Query caches. Avoid duplicating server data in `useState` or `Zustand`.
- **Loading UI**: Use the `Spinner` component from `packages/ui/src/components/spinner.tsx` for granular loading or Skeletons for page-level transitions.
- **Type Safety**: Use symbols from `apps/web/lib/types.ts` and `packages/shared/src/types`. Never use `any`.

### Domain Logic
- **Manifestação Status**: Use `ManifestacaoBadge` for consistent status representation.
- **Formatting**: Never format currency or dates manually. Use:
  - `formatCurrency` from `packages/shared/src/formatters/currency.ts`
  - `formatDate` from `packages/shared/src/formatters/date.ts`
  - `formatCnpj` from `packages/shared/src/validators/cnpj.ts`

## Key Symbols to Leverage

| Symbol | Category | Purpose |
| :--- | :--- | :--- |
| `cn` | Utility | Merging Tailwind classes safely |
| `useDocuments` | Hook | Fetching and filtering fiscal documents |
| `useManifestar` | Hook | Executing SEFAZ manifestation events |
| `ManifestacaoBadge` | Component | Standardized visual for document status |
| `Button` | Component | Primary UI interaction point with variants |
| `isValidChaveAcesso` | Validator | Validating the 44-digit NFe/CTe key |

## Troubleshooting Guide
- **Z-Index Issues**: Check `apps/web/app/globals.css` for layering constants; ensure Radix Dialogs/Popovers are portaled correctly.
- **Hydration Errors**: Ensure client-only logic (like `localStorage` or `Date.now()`) is wrapped in `useEffect` or uses the `useMounted` pattern.
- **Performance**: Use `useDebounce` (found in `apps/web/lib/hooks/use-debounce.ts`) for search inputs to prevent API spamming.
