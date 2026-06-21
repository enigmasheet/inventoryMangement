# Multitenant Inventory Management System

A Next.js 16 multitenant inventory management system for small shop owners. Multiple independent shops (e.g., a liquor shop and a bicycle shop) run on the same application with complete data isolation — each shop gets its own custom product attributes, stock tracking, low-stock alerts, and stock take flows.

Built as a final year project.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | PostgreSQL 17 (Neon: cloud-hosted) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | Better Auth (Google OAuth) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Validation | Zod |
| Testing | Vitest |
| Hosting | Vercel + Neon/Supabase |

## Features

- **Multitenancy** — data isolation via `tenantId` on every tenant-owned table; each shop's data, users, and product structure are fully isolated
- **Google OAuth** — sign in with Google; each user is scoped to one tenant/shop
- **Custom Attributes** — each shop defines its own product fields (expiry dates for liquor, size/color for bicycles) without code changes
- **Product Catalog** — CRUD with search, pagination, CSV export; status badges (OK / Low / Out)
- **Stock Movements** — record stock IN/OUT per product with complete audit trail
- **Low-Stock Alerts** — dashboard highlights products below configurable thresholds
- **Expiry Alerts** — date-typed attributes within 30 days flagged on dashboard and product detail
- **Stock Takes** — create stock takes with expected quantities, record actual counts, apply adjustments via transactional updates
- **Profit Tracking** — cost price tracking with margin percentage on product list
- **Dashboard** — summary metrics (total products, low stock, expiring soon), recent movements, active stock takes
- **Dark Mode** — Vercel-style dark theme by default with toggle; persists in localStorage
- **PWA** — service worker, manifest, app icons for installable web app

## Prerequisites

- **Node.js** 20.9+
- **pnpm** — `npm install -g pnpm`

## Getting Started

### 1. Install dependencies

```sh
pnpm install
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your Google OAuth credentials:

```sh
cp .env.example .env
```

Required variables in `.env`:
- `DATABASE_URL` — your Neon PostgreSQL connection string
- `GOOGLE_CLIENT_ID` — from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `BETTER_AUTH_SECRET` — generate with `openssl rand -hex 32`
- `BETTER_AUTH_URL` — `http://localhost:3000` for local dev
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` for local dev

### 4. Run migrations

```sh
pnpm prisma migrate dev --name init
```

### 5. (Optional) Seed demo data

```sh
pnpm seed
```

Seeds two tenants: **Liquor Shop** (`liquor-shop`) and **Bicycle Shop** (`bicycle-shop`), each with sample products, attributes, and stock movements.

### 6. Start the dev server

```sh
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with Google, then create a shop or navigate to an existing one.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest isolation tests |
| `pnpm seed` | Seed demo data |
| `pnpm prisma studio` | Open Prisma Studio (DB browser) |
| `pnpm prisma migrate dev --name <name>` | Create a new migration |
| `pnpm next build` | Start PostgreSQL |

## Architecture

### Multitenancy

Every tenant-owned table carries a `tenantId` column. Every query filters by `tenantId` derived from the session — never from client input. Tenant resolution is via URL path (`/[tenantSlug]/dashboard`) rather than subdomains.

### Security (Defense-in-Depth)

Three independent layers:

1. **`proxy.ts`** — fast optimistic redirect for unauthenticated requests
2. **`/[tenantSlug]/layout.tsx`** — re-checks session + tenant membership (real security boundary)
3. **Server Actions** — independently verify session and scope every query by `tenantId`

Proxy alone is not sufficient (CVE-2025-29927). Every layer independently enforces tenant scoping.

### Project Structure

```
src/
├── app/
│   ├── [tenantSlug]/          # Tenant-scoped routes
│   │   ├── dashboard/         # Metrics, alerts, activity
│   │   ├── products/          # Product catalog + detail + edit
│   │   ├── stock-take/        # Stock take list + detail
│   │   ├── settings/          # Custom attribute definitions
│   │   └── layout.tsx         # Tenant layout guard + nav
│   ├── actions/               # Server Actions (products, stock, stock-take, attributes)
│   ├── api/                   # API routes (auth, CSV export)
│   └── page.tsx               # Landing page
├── components/                # Shared UI components
├── lib/                       # Auth, DB, logger, utils
└── proxy.ts                   # Proxy (replaces middleware.ts)
```

## Phases

| Phase | Description | Status |
|---|---|---|
| 0 | Project Setup (Next.js, Docker, Prisma, shadcn/ui, Zod) | ✅ |
| 1 | Tenant & Auth Foundation (Better Auth, Google OAuth, proxy, layout guard) | ✅ |
| 2 | Product Catalog & Custom Attributes (CRUD, dynamic forms) | ✅ |
| 3 | Stock Movements & Low Stock Alerts | ✅ |
| 4 | Dashboard & Polish (metrics, empty/loading/error states, dark mode, PWA) | ✅ |
| 5 | Testing, Hardening & Deployment | 🔄 In Progress |
