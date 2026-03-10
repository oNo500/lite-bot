# Boilerplate

A pnpm + Turborepo monorepo with Next.js apps and shared packages.

## Prerequisites

- **Node.js** 22 (see `.nvmrc`)
- **pnpm** 10.30+
- **PostgreSQL** (only required for `apps/api-web`)

## Workspace

| Path | Type | Description |
|---|---|---|
| `apps/web` | Next.js frontend app | Frontend-only template, no database; [README](apps/web/README.md) |
| `apps/api-web` | Next.js full-stack app | Includes PostgreSQL + Better Auth; [README](apps/api-web/README.md) |
| `packages/ui` | Shared UI component library | Internal component package based on shadcn/ui |
| `packages/icons` | Icon package | Project-specific icon set |
| `packages/eslint-config` | Shared ESLint config | Unified monorepo lint rules |

## Tech Stack

- **Framework**: Next.js 16 (App Router, React Compiler)
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL + Drizzle ORM (`api-web` only)
- **Auth**: Better Auth (`api-web` only)
- **ENV**: `@t3-oss/env-nextjs` + Zod, managed in `src/config/env.ts`
- **Routing**: `src/config/app-paths.ts` as single source of truth
- **Fetch**: `@infra-x/fwrap`
- **Themes**: `next-themes`
- **Testing**: Vitest + Testing Library
- **Monorepo**: pnpm workspaces + Turborepo

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api-web/.env.example apps/api-web/.env.local
```

### 3. Initialize the database (api-web only)

```bash
pnpm -F api-web db:push
```

### 4. Start the dev server

```bash
pnpm dev                # all apps
pnpm -F web dev         # apps/web only
pnpm -F api-web dev     # apps/api-web only
```

## Development

```bash
# Lint
pnpm lint

# Type check
pnpm typecheck

# Tests
pnpm -F web test                       # all tests
pnpm -F web test -- --project=unit     # unit only (src/**/*.test.*)
pnpm -F web test -- --project=e2e      # e2e only (__tests__/e2e/**)
pnpm -F api-web test

# Upgrade dependencies
pnpm up:all
```

CI runs lint / typecheck / test automatically on pull requests.

## Architecture

All apps follow **Feature-Based Architecture** (based on bulletproof-react).

### Rules

- All route paths must be managed in `src/config/app-paths.ts` — no hardcoded string paths in components
- Features must not reference each other directly; shared logic must be lifted to `components/`, `hooks/`, or `lib/`
- No `index.ts` barrel files inside feature directories — import directly from source files
- One-way dependency flow: `app/ → features/ → components/, hooks/, lib/, config/`
- Pages under `app/` handle routing only; business logic and JSX belong in `features/`

### Feature directory structure

```
src/features/<name>/
  components/   # sub-components (optional)
  hooks/        # hooks (optional)
  utils/        # utilities (optional)
  api/          # data fetching and API calls (optional)
  types.ts      # type definitions (optional)
  <entry>.tsx   # feature entry component, exported directly (no barrel)
```

### Test file placement

Test files live alongside source files. `__tests__/` is reserved for cross-module e2e scenarios and setup:

```
src/
  features/
    foo/
      bar.tsx
      bar.test.tsx        # co-located with source
__tests__/
  e2e/                    # cross-module user flows
  setup.ts                # @testing-library/jest-dom
```

See [docs/style-guide.md](docs/style-guide.md) for full conventions.
