# Testing

## Overview

Testing uses **Vitest** with Prisma's driver adapter for database tests. Tests connect to the same PostgreSQL database as the dev server. There are currently **7 cross-tenant isolation tests** that verify the core multitenancy invariant.

## Running Tests

```sh
pnpm test          # Run all tests (vitest run)
pnpm vitest        # Run in watch mode (if vitest is installed globally)
```

## Test Prerequisites

1. Docker PostgreSQL running: `docker compose up -d`
2. Migrations applied: `pnpm prisma migrate dev`
3. Seed data applied: `pnpm seed` (seeds `liquor-shop` and `bike-shop` tenants)

## Configuration

`vitest.config.ts`:

```typescript
import "dotenv/config";
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

- Loads `.env` via `dotenv/config` for `DATABASE_URL`
- Globals enabled (`describe`, `it`, `expect` available without imports)
- Tests in `tests/**/*.test.ts`
- `@` alias configured to match Next.js tsconfig

## Test Database Setup

Tests connect directly to Prisma (not through Next.js):

```typescript
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
```

## Current Tests: Cross-Tenant Isolation

File: `tests/isolation.test.ts`

These tests verify the fundamental multitenancy invariant: **no tenant can access another tenant's data**.

### Test Data Setup

```typescript
let tenantA: { id: string; slug: string };  // liquor-shop
let tenantB: { id: string; slug: string };  // bike-shop
let productA: { id: string };                // first product in tenantA
let productB: { id: string };                // first product in tenantB
```

### Test Cases

| # | Test | What it verifies |
|---|---|---|
| 1 | `findFirst with wrong tenantId returns null` | Cross-tenant `findFirst` returns `null` (not found) |
| 2 | `findFirst with correct tenantId returns the record` | Same-tenant `findFirst` returns the record |
| 3 | `raw SQL query is scoped by tenantId` | Even raw SQL queries correctly filter when `tenantId` is applied |
| 4 | `update guarded by findFirst prevents cross-tenant write` | Pattern: `findFirst` with wrong `tenantId` → `null` → update never executed |
| 5 | `attribute definitions are tenant-scoped` | Attribute definitions from tenant A are not visible to tenant B |
| 6 | `stock movements are tenant-scoped` | Stock movements from tenant A are not visible to tenant B |
| 7 | `tenant A sees different products from tenant B` | No product IDs overlap between tenants |

### Key Test Pattern

```typescript
it("findFirst with wrong tenantId returns null", async () => {
  const result = await prisma.product.findFirst({
    where: { id: productA.id, tenantId: tenantB.id },
  });
  expect(result).toBeNull();
});
```

This pattern — `findFirst` with a known ID but wrong `tenantId` — is the exact guard used in every Server Action.

## Writing New Tests

### Adding a Feature Test

```typescript
// tests/stock-take.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

describe("stock take flow", () => {
  let tenant: { id: string };

  beforeAll(async () => {
    tenant = await prisma.tenant.findFirstOrThrow({
      where: { slug: "liquor-shop" },
    });
  });

  it("cannot start a second stock take while one is in progress", async () => {
    // Verify business logic directly via DB
    const activeCount = await prisma.stockTake.count({
      where: { tenantId: tenant.id, status: "in_progress" },
    });
    // ... assert
  });
});
```

### Testing Server Actions Directly

Server Actions are async functions — they can be imported and called directly in tests if the session issue is handled (you'd need to mock `auth.api.getSession` or test the internal DB logic directly).

### Testing Guidelines

1. **Test the isolation invariant** — every new feature that creates tenant-scoped data should have a test verifying cross-tenant isolation
2. **Use seed data** — the `pnpm seed` command creates predictable test fixtures (`liquor-shop` and `bike-shop`)
3. **Test the guard, not the data** — focus on whether the tenant filter works, not on specific field values
4. **Keep tests database-dependent** — these are integration tests against the real Postgres, not unit tests

## Future Testing Plans (Phase 5)

- Feature tests for stock take flows (start, count, complete, cancel)
- Server Action unit tests with mocked session
- Dashboard query tests (raw SQL)
- CSV export response format tests
- Error boundary rendering tests (Vitest + React Testing Library)
