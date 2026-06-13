# Conventions — Radar

## Repo structure
Two separate repos (or two folders in a monorepo):
```
radar/
├── radar-app/       # React Mini App frontend
└── radar-server/    # Bun + Hono backend
```

## Folder naming
- All folders: `camelCase`
- Exception: top-level dirs (`src`, `public`, `dist`) lowercase

## File naming
- React components: `PascalCase.tsx` (e.g. `ResearchCard.tsx`)
- Everything else: `camelCase.ts` (e.g. `riskScore.ts`, `api.ts`)
- Migration files: `001_init.sql`, `002_add_chain_field.sql`
- No barrel `index.ts` files — import directly

## TypeScript rules
- Strict mode on
- No `any` — use `unknown` and narrow
- All API responses typed — no implicit `any` from fetch
- Service layer returns `null` on failure, never throws
- Pure functions for risk score engine (easier to test)

## Code style
- Async/await only — no `.then()` chains
- Early returns over nested if/else
- Constants in `SCREAMING_SNAKE_CASE` in constants files
- No magic numbers inline — everything named in constants

## Commit format
```
type(scope): short description in sentence case

Types:  feat | fix | chore | refactor | docs | test
Scopes: app | server | bot | cache | db | services | ui

Examples:
feat(server): add bundle detection for Solana tokens
feat(app): implement research card with SWR refresh
fix(cache): handle null return on Redis miss
chore(db): add index on alerts.is_active
refactor(services): extract risk score into pure function
docs: update TRD with Hono route structure
```

## Branching strategy
```
main          always stable, always deployable, never commit directly
dev           integration branch — merge features here first
feature/RADAR-XXX-short-name    one branch per epic
```

## API response shape (backend)
All routes return this shape — no exceptions:
```typescript
// Success
{ data: T, error: null }

// Failure
{ data: null, error: { message: string, code: string } }
```

## Frontend data fetching
- Always show loading state before data arrives
- Always show error state if fetch fails
- Stale-while-revalidate: show cached data immediately, refresh silently
- Never block the UI waiting for fresh data

## Telegram security
- Every backend request must include Telegram init data in Authorization header
- Backend validates init data hash on every request
- Never trust user_id from request body — always extract from validated init data

## Environment variables
Never hardcode secrets. All config from `.env`.

### Backend `.env.example`
```
TELEGRAM_BOT_TOKEN=
HELIUS_API_KEY=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
SUPABASE_URL=
SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
FRONTEND_URL=
NODE_ENV=development
```

### Frontend `.env.example`
```
VITE_API_URL=
VITE_BOT_USERNAME=
```
