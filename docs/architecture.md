# Architecture

## Overview

The system is a multitenant inventory management application built entirely with Next.js 16 (App Router). A single deployed instance serves multiple independent shops, with complete data isolation between tenants. Each shop is identified by a URL path segment (`/[tenantSlug]/dashboard`) rather than a subdomain.

## Multitenancy Strategy

### Shared Database, Tenant-ID Column

Every tenant-owned database table carries a `tenantId` column. Every query filters by `tenantId` derived from the authenticated session — never from client input.

```prisma
model Product {
  id       String  @id @default(cuid())
  tenantId String
  tenant   Tenant  @relation(fields: [tenantId], references: [id])
  name     String
  // ...
}
```

### Tenant Resolution

- **URL path** — `/[tenantSlug]/dashboard` — no subdomains, works identically on localhost and production
- **Slug → ID** — the layout resolves the slug to a tenant ID via `prisma.tenant.findUnique({ where: { slug } })`
- **Session binding** — the authenticated user's `tenantId` is checked against the resolved tenant; mismatches get redirected

### Why Not Schema-per-Tenant or Row-Level Security?

| Approach | Complexity | Isolation | Chosen? |
|---|---|---|---|
| Shared DB, tenantId column | Low | Good (with discipline) | ✅ |
| Schema-per-tenant | High | Strong | Future |
| PostgreSQL Row-Level Security | Medium | Strong | Future |

The shared-DB approach was chosen for simplicity: one set of migrations, one Prisma schema, straightforward debugging. RLS is documented as a future hardening step.

## Security Model: Defense-in-Depth (3 Layers)

The system does **not** rely on a single layer for auth. Three independent layers each verify the request independently.

### Layer 1: Proxy (`proxy.ts`)

Fast, optimistic redirect for **unauthenticated** requests only. Never checks tenant membership.

```typescript
export default async function proxy(request: Request) {
  const url = new URL(request.url);
  // Bypass next.js internals and auth API
  if (url.pathname.startsWith("/_next") || url.pathname.startsWith("/api/"))
    return NextResponse.next();

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/:tenantSlug/:path*"] };
```

- Skips `/_next` (static assets) and `/api/` (auth callbacks)
- Matches `/:tenantSlug/:path*` only
- **Insufficient alone** — see CVE-2025-29927

### Layer 2: Tenant Layout (`[tenantSlug]/layout.tsx`)

The real security boundary. A Server Component that re-checks the session and verifies tenant membership before rendering anything.

```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session?.user.tenantId) redirect("/");

const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
if (!tenant || tenant.id !== session.user.tenantId) redirect("/");
```

- Runs on every navigation within the tenant scope
- Redirects to `/` on any mismatch
- Renders nothing if unauthorized

### Layer 3: Server Actions

Every Server Action independently verifies `session.user` and scopes its query by `tenantId`.

```typescript
export async function deleteProduct(productId: string, tenantSlug: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.tenantId) return { error: "Unauthorized" };

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: session.user.tenantId },
  });
  if (!product) return { error: "Not found" };
  // ...
}
```

Server Actions are public POST endpoints — they can be called directly, not just from your UI. Each one independently guards itself.

## Data Flow

### Request Lifecycle

```
Browser ──GET /liquor-shop/products──►
                                       │
                                    proxy.ts
                                      │
                              session? No ──► redirect to /
                                      │
                              Yes (pass-through)
                                      │
                               [tenantSlug]/layout.tsx
                                      │
                              session.tenantId? No ──► redirect to /
                                      │
                              Yes ──► tenant.slug === session.tenantId?
                                      │
                              No ──► redirect to /
                                      │
                              Yes ──► render children
                                      │
                              ┌── Server Components ──┐
                              │  Data fetching with   │
                              │  tenantId filter      │
                              └───────────────────────┘
```

### Server Action Lifecycle

```
Browser ──POST form action ──►
                                Server Action
                                  │
                          auth.api.getSession()
                                  │
                          session? No ──► return { error: "Unauthorized" }
                                  │
                          Yes ──► query with findFirst + tenantId
                                  │
                          not found? ──► return { error: "Not found" }
                                  │
                          Yes ──► mutate, revalidatePath, return null
```

## Project Structure

```
src/
├── app/
│   ├── [tenantSlug]/              # Tenant-scoped routes
│   │   ├── dashboard/             # Metrics, alerts, recent activity
│   │   ├── products/              # Product list, detail, edit, new
│   │   ├── stock-take/            # Stock take list and detail
│   │   ├── settings/              # Attribute definition CRUD
│   │   ├── layout.tsx             # Tenant layout guard + nav
│   │   ├── error.tsx              # Tenant-scoped error boundary
│   │   ├── loading.tsx            # Skeleton loader
│   │   └── not-found.tsx          # 404 page
│   ├── create-shop/               # New tenant creation
│   ├── actions/                   # Server Actions
│   │   ├── products.ts            # Product CRUD
│   │   ├── stock-take.ts          # Stock take lifecycle
│   │   ├── attributes.ts          # Attribute definition CRUD
│   │   └── stock.ts               # Stock movements
│   ├── actions.ts                 # createShop
│   ├── api/
│   │   ├── auth/[...all]/         # Better Auth handler
│   │   └── export/                # CSV export API routes
│   ├── globals.css                # Tailwind v4 theme
│   ├── layout.tsx                 # Root layout (fonts, PWA, dark script)
│   └── page.tsx                   # Landing page
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── product-list.tsx           # Client-side product table
│   ├── product-form.tsx           # Product create/edit form
│   ├── product-pagination.tsx     # Pagination nav
│   ├── theme-toggle.tsx           # Dark mode toggle
│   ├── sign-in-button.tsx         # Google sign-in button
│   ├── sign-out-button.tsx        # Sign out button
│   ├── stock-take-item-row.tsx    # Per-row counted input
│   └── stock-take-list-error.tsx  # Error toast helper
├── lib/
│   ├── auth.ts                    # Better Auth config
│   ├── db.ts                      # Prisma client
│   ├── logger.ts                  # Structured logger
│   └── utils.ts                   # Tailwind utility
├── generated/prisma/              # Prisma client (generated)
└── proxy.ts                       # Proxy (replaces middleware.ts)
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| `findFirst` with `tenantId` over `findUnique` | `findUnique` by ID only bypasses tenant scope; `findFirst` with `tenantId` naturally 404s on cross-tenant access |
| void-returning action wrappers | Server Actions used as `<form action>` must return `void | Promise<void>`; internal functions return `{ error? }` for composition |
| `useActionState` + `submittedRef` | Correct toast behavior without double-firing on React 19 strict mode |
| `revalidatePath` in every mutation | Ensures UI consistency without forcing full page reloads |
| `await params` everywhere | Next.js 16 requires async params access; `const { slug } = await params` |
| Prisma driver adapter | Prisma 7 removed the Rust engine; must use `@prisma/adapter-pg` + `pg` |
| Tenant slug in URL (not subdomain) | Works on localhost without DNS config; identical behavior in dev and production |
