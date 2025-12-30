# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds all application code.
- `src/components/` contains reusable UI and feature components; base shadcn/ui primitives live in `src/components/ui/`.
- `src/pages/` defines route-level pages like `Index.tsx` and `NotFound.tsx`.
- `src/hooks/` stores custom hooks (for example, localStorage helpers).
- `src/lib/` provides shared utilities.
- Static assets are in `public/`, and production builds are emitted to `dist/`.

## Build, Test, and Development Commands
- `npm run dev`: start Vite dev server on a local port for active development.
- `npm run build`: create a production build in `dist/`.
- `npm run build:dev`: build with development mode flags for easier debugging.
- `npm run preview`: serve the production build locally to validate output.
- `npm run lint`: run ESLint across the codebase.

## Coding Style & Naming Conventions
- TypeScript + React (Vite + SWC) are used throughout; prefer `.tsx` for components and `.ts` for utilities.
- Indentation is 2 spaces in code and config files.
- Component files use `PascalCase` (e.g., `ExpenseForm.tsx`); hooks use `useCamelCase` (e.g., `use-local-storage.ts`).
- ESLint is configured in `eslint.config.js`; run `npm run lint` before submitting changes.

## Testing Guidelines
- There is no dedicated test runner or test folder yet.
- If you add tests, colocate them near the feature (e.g., `src/components/ExpenseForm.test.tsx`) and document any new scripts in `package.json`.
- For now, validate changes by running `npm run lint` and `npm run preview`.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commits, with a scope-less type prefix like `feat: ...` or `fix: ...`.
- Keep commits focused on a single change; split UI refactors from logic updates when practical.
- PRs should include: a concise summary, any linked issues, and screenshots or GIFs for UI changes.

## Configuration & Data Storage
- User data is persisted in browser localStorage; avoid storing sensitive information.
- Environment variables are not required by default; document any new variables in `README.md`.

## Agent-Specific Instructions
- Keep edits minimal and local to the feature being changed.
- Prefer updating existing components and hooks over adding new global utilities.
