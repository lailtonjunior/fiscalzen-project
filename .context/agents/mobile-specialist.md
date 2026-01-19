# Mobile Specialist Agent Playbook

## Mission
To ensure a high-quality, high-performance experience on mobile devices by optimizing the FiscalZen web application for touch interfaces, small screens, and mobile network conditions.

## Focus Areas

### 1. Responsive Layout & Navigation
Primary focus is on maintaining and extending the mobile navigation system and responsive shell.
- **Key Directory**: `apps/web/components/layout`
- **Critical File**: `apps/web/components/layout/mobile-nav.tsx`
- **Core Symbol**: `MobileNavProps`

### 2. Touch-Optimized UI Components
Refining the shared UI library to ensure touch targets and accessibility on mobile.
- **Directory**: `packages/ui/src/components`
- **Key Components**: `button.tsx`, `input.tsx`, `badge.tsx`, `spinner.tsx`.

### 3. Mobile-First Views
Specialized screens that handle complex fiscal data (NFe, NFSe, Manifestação) on limited screen real estate.
- **Directories**: 
    - `apps/web/app/(dashboard)/documentos`
    - `apps/web/app/(dashboard)/manifestacao`
    - `apps/web/components/manifestacao`

### 4. Efficient Data Hooks
Utilizing hooks to ensure mobile performance and avoid unnecessary re-renders or heavy data fetching.
- **Directory**: `apps/web/lib/hooks`
- **Priority Hooks**: `useDocuments`, `useManifestacao`, `useDebounce`.

---

## Workflows & Steps

### Implementing a New Mobile-Responsive View
1.  **Analyze Screen Requirements**: Identify which columns of a table or sections of a form are "critical" for mobile versus "secondary" (hidden on mobile).
2.  **Layout Definition**: Use Tailwind's mobile-first approach (e.g., `w-full md:w-1/2`).
3.  **Navigation Integration**: If the view requires deep linking or specific actions, ensure they are accessible via the `MobileNav` or a floating action button (FAB).
4.  **Touch Target Verification**: Ensure all interactive elements (buttons, toggles) have a minimum height/width of 44px.
5.  **Form Optimization**: Use appropriate input types (e.g., `type="number"` for CNPJ/CPF to trigger numeric keypads).

### Optimizing Data Heavy Components (e.g., Document Lists)
1.  **Card-based Fallbacks**: On screens `< 768px`, switch from `Table` layouts to `Card` layouts.
2.  **Infinite Scroll/Pagination**: Ensure `useDocuments` pagination is correctly implemented to prevent mobile browser crashes from large DOM trees.
3.  **Skeleton States**: Implement `spinner.tsx` or skeleton loaders for a smoother perceived performance on slower mobile networks.

---

## Code Patterns & Best Practices

### Responsive Utility Usage
Always use the `cn()` utility from `apps/web/lib/utils.ts` for conditional responsive classes.

```typescript
// Example Pattern: Responsive Table Cell
<div className={cn(
  "p-4",
  "hidden md:table-cell", // Hidden on mobile
  className
)}>
  {content}
</div>
```

### Mobile-Specific Form Patterns
For fiscal identifiers like CNPJ/CPF, leverage shared validators and formatters to provide immediate feedback.
- Use `packages/shared/src/validators` for real-time validation.
- Use `packages/shared/src/formatters` to mask inputs as the user types.

### Interaction Guidelines
- **Badges**: Use `ManifestacaoBadge` for status visibility. Ensure the text is legible on small screens.
- **Modals**: Use `Drawer` or full-screen `Dialog` for mobile instead of standard small popups to maximize usable space.
- **Loading**: Use the `Spinner` component specifically for action feedback on buttons to prevent double-taps.

---

## Key Files & Purposes

| File Path | Purpose |
| :--- | :--- |
| `apps/web/components/layout/mobile-nav.tsx` | Entry point for mobile navigation and drawer logic. |
| `apps/web/lib/hooks/use-debounce.ts` | Crucial for mobile search inputs to reduce API load. |
| `packages/ui/src/components/button.tsx` | Base interaction component with loading states. |
| `apps/web/components/manifestacao/manifestacao-badge.tsx` | Visual status indicators optimized for density. |
| `packages/shared/src/formatters/document.ts` | Logic for shortening document numbers for mobile display. |

---

## Performance Checklist for Mobile
- [ ] **Images/Icons**: Are we using SVGs or optimized icon sets (Lucide)?
- [ ] **Bundle Size**: Is the mobile-specific logic adding unnecessary weight to the main bundle?
- [ ] **Input Lag**: Is the `useDebounce` hook applied to search/filter inputs?
- [ ] **Touch Targets**: Are all buttons at least 44x44 pixels?
- [ ] **Viewport**: Is the layout preventing horizontal scrolling unless explicitly intended (e.g., data tables)?
