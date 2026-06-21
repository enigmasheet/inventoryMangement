# Multitenant Inventory Management System — Project Plan

A Next.js–only, multitenant inventory management system, scoped for a final year project and designed to be built incrementally.

---

## 1. Problem Statement

Small shop owners — for example a liquor shop and a bicycle shop — currently track inventory manually or in disconnected spreadsheets. Existing inventory software is either too generic to fit shop-specific needs (a liquor shop needs expiry dates and volume; a bicycle shop needs size and color variants) or too expensive to justify for a single small shop.

This project builds a single web application that multiple independent shops can use simultaneously, where each shop's data, users, and product structure are completely isolated from every other shop's, even though they all run on the same deployed application and database. The system must let each shop define its own custom product attributes without requiring code changes, support basic stock-in/stock-out tracking, and surface low-stock alerts — while remaining simple enough to design, build, and defend within a final year project timeline.

### Objectives
- Demonstrate a working multitenant architecture (data isolation, tenant-scoped auth, tenant-scoped UI) using only Next.js.
- Support category-specific custom fields per tenant without schema changes per shop.
- Provide core inventory operations: product CRUD, stock in/out, low-stock alerts, basic dashboard.
- Produce a system that is realistically usable by two or more actual small shop owners (your friend's bicycle shop and your liquor shop), giving the project a genuine real-world validation case.

### Out of scope (for now)
Purchase orders, supplier management, multi-warehouse tracking, role hierarchies beyond a single shop-owner login, billing/payment integration, real-time sync across devices. These are listed under Future Enhancements.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Frontend + backend (Server Actions) in one codebase |
| Database | PostgreSQL 17 (Docker local, Neon/Supabase for prod) | Dockerized for development |
| ORM | Prisma 7 | Type-safe schema, migrations, driver-adapter client (no more Rust engine) |
| Auth | Better Auth | Google OAuth provider; see note below |
| Styling | Tailwind CSS v4 + shadcn/ui | Default with `create-next-app`; fast to build a clean dashboard |
| Validation | Zod | Shared schema validation on forms and Server Actions |
| Testing | Vitest | Server Action unit tests (Phase 5) |
| Hosting | Vercel + Neon/Supabase Postgres | Free tier sufficient for a student project |

**Why Better Auth instead of Auth.js (NextAuth)**: as of late 2025, Auth.js's own maintainers stepped back and the project moved into maintenance mode (security patches only) under the Better Auth team. Better Auth is the team's own current recommendation for new projects, has a cleaner App-Router-native API, and — relevantly for this project — ships first-class multi-tenancy primitives if you ever want to lean on them. The plan below still uses your own `Tenant` model rather than Better Auth's organization plugin, to keep the schema simple and match the design already covered with your supervisor; treat the plugin as an optional Future Enhancement.

### Multitenancy strategy
Shared database, every tenant-owned table carries a `tenantId` column, and every query is filtered by it. Tenant resolution is via URL path segment (`/[tenantSlug]/dashboard`) rather than subdomains — no DNS configuration needed, works identically on localhost and in production. This is the simplest correct approach for a first build; schema-per-tenant and Row-Level Security are documented as future hardening steps, not built initially.

### Security best practice: defense-in-depth, not proxy-only auth
Next.js 16's `proxy.ts` (the renamed `middleware.ts`) is convenient for redirecting unauthenticated users, but a real vulnerability — CVE-2025-29927 — showed that relying on Middleware/Proxy alone for authorization can be bypassed under certain conditions. The current recommended pattern, and the one this plan follows, is defense-in-depth across three layers: `proxy.ts` does a cheap, optimistic redirect for obviously-unauthenticated requests; the tenant layout (`/[tenantSlug]/layout.tsx`, a Server Component) re-checks the session and tenant membership before rendering anything; and every Server Action independently re-verifies `session.user` and scopes its query by `tenantId`, since Server Actions are public POST endpoints that can be called directly, not just from your UI. Appendix D's isolation-test guard already follows this third layer correctly — the addition for this revision is the layout-level check in Phase 1, so no single layer is a single point of failure.

---

## 3. Data Model (Prisma)

```prisma
model Tenant {
  id        String   @id @default(cuid())
  slug      String   @unique
  shopName  String
  category  String   // e.g. "liquor", "bicycle", "general"
  createdAt DateTime @default(now())
  users     User[]
  products  Product[]
  attributeDefs AttributeDefinition[]
  stockMovements StockMovement[]
}

model User {
  id            String    @id @default(cuid())
  tenantId      String?
  tenant        Tenant?   @relation(fields: [tenantId], references: [id])
  email         String    @unique
  name          String
  emailVerified Boolean   @default(false)
  image         String?   // Google profile photo
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]
}

// Session, Account, and Verification models are scaffolded for you —
// don't hand-write them. Run `pnpm dlx @better-auth/cli generate` after
// configuring lib/auth.ts (Phase 1) and it will add these to your
// schema.prisma automatically, matching whatever providers you enabled.
// The only manual step is adding the `tenantId` field above to User.

model AttributeDefinition {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  key       String   // e.g. "expiryDate", "size", "color"
  label     String   // display label
  type      String   // "text" | "number" | "date"
}

model Product {
  id            String   @id @default(cuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  name          String
  sku           String
  unitPrice     Decimal
  quantity      Int      @default(0)
  lowStockLimit Int      @default(5)
  createdAt     DateTime @default(now())
  attributes    ProductAttributeValue[]
  movements     StockMovement[]

  @@unique([tenantId, sku])
  @@index([tenantId])
}

model ProductAttributeValue {
  id             String   @id @default(cuid())
  productId      String
  product        Product  @relation(fields: [productId], references: [id])
  attributeDefId String
  attributeDef   AttributeDefinition @relation(fields: [attributeDefId], references: [id])
  value          String

  @@index([productId])
}

model StockMovement {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  type      String   // "IN" | "OUT"
  quantity  Int
  note      String?
  createdAt DateTime @default(now())

  @@index([tenantId, productId])
}
```

### Schema notes
- `User.password` is omitted — auth is Google OAuth only, handled by Better Auth.
- `User.tenantId` is optional because a user exists after Google sign-in but before they create/join a shop.
- Prisma 7 requires a driver adapter for the client (`@prisma/adapter-pg`) and configures the connection in `prisma.config.ts` rather than purely via `.env` — see Appendix A.
- Indexes on `Product(tenantId)` and `StockMovement(tenantId, productId)` for query performance.
- Every Server Action and query must include `where: { tenantId }` — this is the core integrity constraint of the whole system.

---

## 4. Build Phases

Each phase ends in a working, demoable state. Do not move to the next phase until the current phase's acceptance criteria pass.

### Phase 0 — Project Setup
**Tasks**
- Initialize Next.js 16 app (App Router, TypeScript; Tailwind v4 is included automatically).
- Set up Docker Compose for PostgreSQL 17.
- Set up Prisma 7 with the `@prisma/adapter-pg` driver adapter, connection configured in `prisma.config.ts`.
- Configure shadcn/ui base components.
- Set up Zod for shared validation.
- Create `.env.example` with `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

**Acceptance criteria:** App runs locally, connects to Docker Postgres via the driver adapter, Prisma `migrate dev` succeeds with the full schema.

### Phase 1 — Tenant & Auth Foundation
**Tasks**
- Configure Better Auth (`src/lib/auth.ts`) with the Prisma adapter and Google social provider; run `pnpm dlx @better-auth/cli generate` to scaffold `Session`/`Account`/`Verification` into the Prisma schema.
- Build landing page (`/`) with "Sign in with Google" button.
- Implement session callback: find-or-create User by email (Better Auth handles this via the Prisma adapter automatically).
- Build tenant creation flow: authenticated user with no tenant → redirected to `/create-shop` → form for shop name + category → generates unique slug → creates Tenant → links User.
- Add `proxy.ts` (Next.js 16) that does a lightweight, optimistic check — redirect to `/` if there's no session cookie at all — but treat this as a fast-path UX redirect, not the security boundary.
- Add the real authorization check in `/[tenantSlug]/layout.tsx` (Server Component): re-fetch the session, verify the user belongs to this tenant, `redirect()` otherwise. This is the layer that actually protects tenant data, per the defense-in-depth note above.
- Build minimal layout: `/[tenantSlug]/dashboard` (placeholder).

**Flow:** Landing → Google Sign-in → (no tenant?) → Create Shop → Dashboard

**Acceptance criteria:** Two separate signups (e.g. `/liquorshop`, `/bicycleshop`) produce two isolated tenants. Logging in as one tenant's user and trying to visit the other tenant's dashboard URL is blocked — and stays blocked even if you simulate bypassing `proxy.ts` directly (confirms the layout guard, not just the proxy, is doing the real check).

### Phase 2 — Product Catalog & Custom Attributes
**Tasks**
- Implement `AttributeDefinition` CRUD: settings page where shop owner defines custom fields.
- Implement `Product` and `ProductAttributeValue` CRUD: list, add, edit, delete.
- Product form dynamically renders input fields based on tenant's `AttributeDefinition` list.
- All queries scoped by `tenantId` via Server Actions.

**Acceptance criteria:** Liquor shop's product form shows expiry date and volume fields; bicycle shop's form shows size and color fields. Products from one tenant never appear in another tenant's list.

### Phase 3 — Stock Movements & Low Stock Alerts
**Tasks**
- Implement `StockMovement` model and "Record Stock In / Stock Out" form per product.
- Each movement updates `Product.quantity` transactionally (Prisma transaction).
- Add `lowStockLimit` field per product (settable by shop owner).
- Build a low-stock list/badge on the dashboard.

**Acceptance criteria:** Recording stock in/out correctly updates running quantity. Products below their threshold appear in a clearly visible low-stock section.

### Phase 4 — Dashboard & Polish
**Tasks**
- Build dashboard summary: total products, total stock value (`sum(quantity * unitPrice)`), low-stock count.
- Add stock movement history view per product.
- Add empty states, loading states, form validation error messages.
- Responsive layout pass (most shop owners will check this on a phone).

**Acceptance criteria:** A new shop owner can sign up, define attributes, add products, record stock movements, and see a meaningful dashboard — all without developer intervention.

### Phase 5 — Testing, Hardening & Deployment
**Tasks**
- Write a cross-tenant isolation test: attempt to fetch/edit another tenant's product via a crafted request, confirm it's rejected.
- Add basic automated tests for Server Actions (Vitest) covering tenant-scoping logic.
- Deploy to Vercel, connect hosted Postgres (Neon/Supabase).
- Seed two demo tenants (liquor shop, bicycle shop) with sample data for defense/demo.

**Acceptance criteria:** Deployed app is publicly reachable, cross-tenant access attempts fail, demo data is in place for both shops.

---

## 5. Suggested Agent Workflow

If using a coding agent to implement this:
1. Feed it one phase at a time, not the whole plan at once — confirm each phase's acceptance criteria before proceeding.
2. Always remind it of the core invariant: every tenant-owned query must filter by `tenantId`. This is worth repeating at the start of every phase prompt, since it's the single most common source of bugs in multitenant systems.
3. After Phase 2 and Phase 5, explicitly ask the agent to write or run an isolation test — this becomes evidence for your project report's evaluation section.
4. Keep the Prisma schema as the single source of truth; if a phase requires a schema change, do the migration first, then the feature code.

---

## 6. Report Structure (for your final year project writeup)

1. Introduction & Problem Statement (use Section 1 above)
2. Related Work — brief comparison with Zoho Inventory, Vyapar, or similar small-business tools
3. System Design — architecture diagram showing tenant resolution flow (URL → proxy → session check → scoped query), ER diagram of the schema in Section 3
4. Implementation — phase-by-phase summary, with the custom-attributes design as the highlighted technical decision
5. Evaluation — cross-tenant isolation test results, a short usability note from your friend (bicycle shop) and yourself (liquor shop) actually using it
6. Conclusion & Future Work — Section 7 below

---

## 7. Future Enhancements

- **Stronger isolation**: migrate from shared-table `tenantId` filtering to PostgreSQL Row-Level Security, or schema-per-tenant, and compare performance/complexity tradeoffs.
- **Purchase orders & suppliers**: track incoming orders from suppliers, expected delivery dates, partial receipt of stock.
- **Multi-location/warehouse support**: let a shop track stock across more than one physical location.
- **Role-based access**: add staff logins with restricted permissions (e.g., can record stock movements but not delete products).
- **Barcode scanning**: integrate a barcode scanner (via device camera, using a library like `html5-qrcode`) for faster stock-in/out.
- **Expiry-based alerts**: for tenants with a date-type attribute (like the liquor shop's expiry date), auto-generate alerts for soon-to-expire stock.
- **Usage-based tiers**: cap free tenants at N products, demonstrating basic SaaS billing logic — could integrate Stripe for a paid tier.
- **Real-time updates**: if a shop has multiple staff on different devices, use Server-Sent Events or a WebSocket layer so stock changes reflect live across sessions.
- **Reporting/export**: CSV export of stock movements and current inventory for accounting purposes.
- **Mobile-first PWA**: turn the app into an installable PWA so shop owners can use it like a native app on their phones.

---

## Appendix A: Phase 0 Setup Commands

### 1. Create Next.js 16 App
```sh
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir
```
(`--src-dir` places pages/components in `src/` for cleaner structure.)

### 2. Set up Docker Postgres
Create `docker-compose.yml` at project root:
```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: invuser
      POSTGRES_PASSWORD: invpass
      POSTGRES_DB: inventory
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Start: `docker compose up -d`

### 3. Install Dependencies
```sh
pnpm add prisma @prisma/client @prisma/adapter-pg pg better-auth @better-auth/cli zod slugify
pnpm add -D vitest @testing-library/react @vitejs/plugin-react
```

### 4. Initialize Prisma
```sh
pnpm prisma init
```
Set `DATABASE_URL="postgresql://invuser:invpass@localhost:5432/inventory"` in `.env`.

Prisma 7 reads the connection from `prisma.config.ts`, and the client needs a driver adapter rather than connecting directly:
```ts
// prisma.config.ts
import { defineConfig, env } from "prisma/config"
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: env("DATABASE_URL") },
})
```
```ts
// src/lib/db.ts
import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
export const prisma = new PrismaClient({ adapter })
```

```sh
pnpm prisma migrate dev --name init
```

### 5. Initialize shadcn/ui
```sh
pnpm dlx shadcn@latest init
```
Select default style, base color. Then add components as needed:
```sh
pnpm dlx shadcn@latest add button card input label table dialog
```

### 6. Set up Better Auth
Create `.env` entries:
```
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
```

Create `src/lib/auth.ts` with the Better Auth configuration (Google social provider, Prisma adapter — see Appendix C).

Create `src/app/api/auth/[...all]/route.ts` exporting Better Auth's handlers.

Run the schema generator once `auth.ts` is configured:
```sh
pnpm dlx @better-auth/cli generate
pnpm prisma migrate dev --name add_auth_tables
```

### 7. .env.example
```sh
DATABASE_URL="postgresql://invuser:invpass@localhost:5432/inventory"
BETTER_AUTH_SECRET="generate-with-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## Appendix B: Next.js 16 Migration Notes

### proxy.ts replaces middleware.ts
- `middleware.ts` is **deprecated** in Next.js 16.
- Use `proxy.ts` in the root of the `src/` directory (or project root).
- Proxy runs on **Node.js runtime only** (no Edge support).
- For backward compatibility, `middleware.ts` still works but will warn.
- Config renames: `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`.
- Better Auth is fully compatible with this rename, but its docs/examples predate it — if you copy a snippet, make sure the file is named `proxy.ts` and exports a `proxy` function (or default export), not `middleware`.
```ts
// src/proxy.ts — optimistic check only, see Phase 1 / security note above
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default async function proxy(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return NextResponse.redirect(new URL("/", request.url))
  return NextResponse.next()
}

export const config = { matcher: ["/:tenantSlug/:path*"] }
```

### Async Request APIs
All synchronous access to request data is removed. Must use `await`:

```ts
// Pages
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
}

// Layouts
export default async function Layout({ params, children }: {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}) {
  const { slug } = await params
}

// Server Actions — params must be passed explicitly, not read from context
"use server"
export async function updateProduct(tenantId: string, formData: FormData) {
  // tenantId must be passed as argument, not read from URL
}
```

### Turbopack Changes
- Turbopack is the **default bundler**.
- Config moved from `experimental.turbopack` to top-level `turbopack` in `next.config.ts`.
- Opt out with `next dev --webpack` or `next build --webpack` if needed.
- If you have a custom `webpack` config, `next build` will fail unless you use `--webpack`.

### ESLint
- `next lint` command is removed; use ESLint CLI directly (`pnpm eslint .`).
- Flat config (`.eslint.config.*`) is the default; `.eslintrc` files may need migration.

### Other Changes
- `next/legacy/image` deprecated.
- `images.domains` deprecated (use `images.remotePatterns`).
- `revalidateTag(tag)` single-arg form deprecated (requires cacheLife profile).
- `next dev` and `next build` use separate output dirs (`.next/dev` for dev).
- TypeScript: run `pnpm next typegen` to generate `PageProps`, `LayoutProps` type helpers.
- Node.js 20.9+ required (Node 18 not supported).

---

## Appendix C: Google OAuth Configuration

### Google Cloud Console Setup
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Client Secret to `.env`

### Better Auth configuration
```ts
// src/lib/auth.ts
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/db"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      tenantId: { type: "string", required: false },
    },
  },
})
```
```ts
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
```

Reading the session inside a Server Component or Server Action (the layer that actually enforces tenant access, per the security note earlier):
```ts
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

const session = await auth.api.getSession({ headers: await headers() })
// session.user.tenantId is available because of the additionalFields config above
```

### Auth Flow Diagram
```
[Landing Page /]
    ↓
[Sign in with Google] → Google OAuth consent screen
    ↓
[Better Auth callback] → find-or-create User by email (Prisma adapter)
    ↓
User has tenantId?
    ├── YES → redirect to /[tenantSlug]/dashboard
    └── NO  → redirect to /create-shop
                  ↓
         [Create Shop form]
         - shop name
         - category (liquor/bicycle/general)
                  ↓
         Server Action:
         1. slugify shop name (append random suffix on collision)
         2. create Tenant
         3. update User.tenantId
         4. redirect to /[tenantSlug]/dashboard
```

---

## Appendix D: Cross-Tenant Isolation Test (Phase 5)

```ts
// tests/isolation.test.ts
import { describe, it, expect } from "vitest"

// These tests assume a seeded DB with:
//   Tenant A (slug: "liquorshop") with Product P1
//   Tenant B (slug: "bicycleshop") with Product P2

describe("cross-tenant isolation", () => {
  it("tenant A cannot fetch tenant B's products", async () => {
    const result = await fetchProductsForTenant("tenant-a-id")
    const productIds = result.map(p => p.id)
    expect(productIds).not.toContain("tenant-b-product-id")
  })

  it("tenant A cannot update tenant B's product", async () => {
    const result = await updateProduct({
      tenantId: "tenant-a-id",
      productId: "tenant-b-product-id",
      name: "hacked"
    })
    expect(result.error).toBeDefined()
  })

  it("tenant A cannot record stock movement on tenant B's product", async () => {
    const result = await recordStockMovement({
      tenantId: "tenant-a-id",
      productId: "tenant-b-product-id",
      type: "IN",
      quantity: 100
    })
    expect(result.error).toBeDefined()
  })
})
```

Every Server Action must include this guard at the top:
```ts
const session = await auth.api.getSession({ headers: await headers() })
if (!session?.user.tenantId) throw new Error("Unauthorized")

const product = await prisma.product.findFirst({
  where: { id: productId, tenantId: session.user.tenantId },
})
if (!product) throw new Error("Not found") // 404 hides existence from other tenants
```
Never accept `tenantId` as a parameter from the client (form field, hidden input, request body) for this check — always derive it from the verified session, or a malicious request could simply pass another tenant's ID.

---

## Appendix E: Optional Simplification — Better Auth's Organization Plugin

Not required for this plan, but worth knowing about for your Future Work section: Better Auth ships an `organization()` plugin that gives you tenant creation, invitations, membership, and roles out of the box, mapping `Organization` → your `Tenant` concept almost one-to-one. Adopting it later would remove the hand-rolled `/create-shop` flow and slug-collision logic in exchange for learning the plugin's API — a reasonable trade to mention as future work, but skip it for the initial build so the custom-attributes design (the actual novel part of your project) stays the focus.

---

*Generated: June 2026 — Next.js 16, Better Auth, Prisma 7, Docker Postgres 17*
