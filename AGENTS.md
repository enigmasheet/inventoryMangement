# AGENTS.md — Multitenant Inventory Management System

## Tech Stack
- Next.js 16 (App Router, Turbopack default)
- Better Auth (Google OAuth) — NOT Auth.js/NextAuth
- Prisma 7 with `@prisma/adapter-pg` driver adapter
- PostgreSQL 17 (Docker: `docker compose up -d`)
- Tailwind CSS v4 + shadcn/ui
- Zod for validation
- Vitest for tests (Phase 5)

## Critical Conventions

### Multitenancy: The One Rule
Every database query must filter by `tenantId` derived from the **session**, never from client input.

```ts
// ✅ Correct
const session = await auth.api.getSession({ headers: await headers() })
const product = await prisma.product.findFirst({
  where: { id: productId, tenantId: session.user.tenantId },
})
if (!product) throw new Error("Not found")

// ❌ Wrong — never accept tenantId from client
const { tenantId } = await params  // NO
formData.get("tenantId")           // NO
```

Always use `findFirst` with `tenantId` (not `findUnique`) to 404 on cross-tenant lookups.

### Defense-in-Depth (3 Layers)
1. **proxy.ts** — fast optimistic redirect for unauthenticated requests only
2. **`/[tenantSlug]/layout.tsx`** — re-checks session + tenant membership (real security boundary)
3. **Server Actions** — independently verify session + scope queries by `tenantId`

proxy.ts alone is NOT sufficient (CVE-2025-29927). Every layer independently enforces tenant scoping.

## Next.js 16 Gotchas
- **proxy.ts** replaces `middleware.ts` — name the file `proxy.ts`, export default `proxy` function
- **`await params`** everywhere — `const { slug } = await params`, never `params.slug`
- `next lint` removed — use `pnpm eslint .`
- Turbopack config: top-level `turbopack` key (not `experimental.turbopack`)
- `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`
- Node.js 20.9+ required

## Better Auth
- Configure in `src/lib/auth.ts` with Google social provider + Prisma adapter
- **Do NOT hand-write Session/Account/Verification models** — they're auto-generated
- After editing `auth.ts`, run: `pnpm dlx @better-auth/cli generate && pnpm prisma migrate dev`
- Read session: `await auth.api.getSession({ headers: await headers() })`
- Auth handler: `src/app/api/auth/[...all]/route.ts`
- Add `tenantId` to Better Auth user via `additionalFields` (schema section)

## Prisma 7
- Uses driver adapter pattern: `@prisma/adapter-pg` + `pg` package
- Connection config in `prisma.config.ts` (not just `.env`)
- Client init: `new PrismaClient({ adapter })` — standard constructor won't work
- Run `pnpm prisma migrate dev --name <name>` after schema changes

## Commands
```sh
pnpm dev                             # Next.js dev server
pnpm prisma migrate dev --name <name> # schema migration
pnpm prisma studio                   # DB browser
docker compose up -d                 # start Postgres
pnpm dlx shadcn@latest add <component> # add shadcn/ui components
pnpm dlx @better-auth/cli generate   # sync Better Auth schema
pnpm eslint .                        # lint (no next lint)
pnpm next typegen                    # generate PageProps/LayoutProps types
```

## Build Order
Phases are strictly sequential: 0 → 1 → 2 → 3 → 4 → 5. Do not skip phases.
- Phase 0: Project Setup (Next.js, Docker, Prisma, shadcn/ui, Zod)
- Phase 1: Tenant & Auth Foundation (Better Auth, Google OAuth, proxy.ts, layout guard, tenant creation)
- Phase 2: Product Catalog & Custom Attributes (AttributeDefinition CRUD, Product CRUD, dynamic forms)
- Phase 3: Stock Movements & Low Stock Alerts (StockMovement model, transactional updates, low-stock UI)
- Phase 4: Dashboard & Polish (summary stats, movement history, empty/loading/error states, responsive)
- Phase 5: Testing, Hardening & Deployment (isolation tests, Vitest, Vercel deploy, demo seed data)

## Source of Truth
Full project plan at `docs/multitenant-inventory-project-plan.md`. Read it for schema details, auth flow diagram, and phase-by-phase acceptance criteria.
