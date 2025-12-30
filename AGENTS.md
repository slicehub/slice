# Repository Guidelines

## Project Structure & Module Organization

- `src/app` contains the Next.js App Router pages, layouts, and route handlers.
- `src/components` holds shared UI components; feature-specific pieces may live in subfolders.
- `src/contexts`, `src/hooks`, and `src/providers` centralize state, hooks, and app-level providers.
- `src/contracts`, `src/config`, and `src/types` define on-chain integrations, configuration, and shared types.
- `public/` hosts static assets; keep filenames stable to avoid cache busting surprises.

## Build, Test, and Development Commands

- `pnpm install`: install dependencies.
- `pnpm dev`: run the Next.js dev server (http://localhost:3000).
- `pnpm build`: create a production build.
- `pnpm start`: run the production server after a build.
- `pnpm lint`: run ESLint with the Next.js config.

## Coding Style & Naming Conventions

- TypeScript + React (`.ts`/`.tsx`) with the Next.js App Router.
- Follow existing formatting and ESLint rules in `.eslintrc.json`; unused vars must be prefixed with `_`.
- Component files use `PascalCase.tsx`; hooks use `useX.ts`; utilities stay in `src/lib` or `src/util`.
- Prefer colocating small, feature-specific components in a relevant folder under `src/components`.

## Testing Guidelines

- There is no dedicated test runner configured in `package.json`.
- If you add tests, document the framework and add a script (e.g., `pnpm test`) in `package.json`.

## Commit & Pull Request Guidelines

- Commits follow Conventional Commit style: `feat:`, `fix:`, `refactor:`, etc.
- Include a concise, scoped summary when helpful (e.g., `feat(connection): add smart wallet`).
- PRs should include a clear description, linked issues, and screenshots or clips for UI changes.

## Configuration & Secrets

- Copy `.env.example` to `.env.local` and set required keys
- Never commit secrets; keep `.env.local` local to your machine.
