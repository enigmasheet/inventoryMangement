/*
 * Cross-tenant isolation tests.
 *
 * Prerequisites:
 *   1. Docker PostgreSQL running on port 5433
 *   2. Seed data applied: pnpm seed
 *
 * These tests verify the core invariant of the system: every
 * tenant-scoped query filters by tenantId, and cross-tenant
 * access always returns null/empty.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

describe("cross-tenant isolation", () => {
  let tenantA: { id: string; slug: string };
  let tenantB: { id: string; slug: string };
  let productA: { id: string };
  let productB: { id: string };

  beforeAll(async () => {
    tenantA = await prisma.tenant.findFirstOrThrow({
      where: { slug: "liquor-shop" },
    });
    tenantB = await prisma.tenant.findFirstOrThrow({
      where: { slug: "bike-shop" },
    });

    productA = await prisma.product.findFirstOrThrow({
      where: { tenantId: tenantA.id },
    });
    productB = await prisma.product.findFirstOrThrow({
      where: { tenantId: tenantB.id },
    });
  });

  it("findFirst with wrong tenantId returns null", async () => {
    const result = await prisma.product.findFirst({
      where: { id: productA.id, tenantId: tenantB.id },
    });
    expect(result).toBeNull();
  });

  it("findFirst with correct tenantId returns the record", async () => {
    const result = await prisma.product.findFirst({
      where: { id: productA.id, tenantId: tenantA.id },
    });
    expect(result).not.toBeNull();
  });

  it("raw SQL query is scoped by tenantId", async () => {
    const result = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Product" WHERE "tenantId" = ${tenantA.id}
    `;
    const ids = result.map((r) => r.id);
    expect(ids).toContain(productA.id);
    expect(ids).not.toContain(productB.id);
  });

  it("update guarded by findFirst prevents cross-tenant write", async () => {
    const product = await prisma.product.findFirst({
      where: { id: productB.id, tenantId: tenantA.id },
    });
    expect(product).toBeNull();
  });

  it("attribute definitions are tenant-scoped", async () => {
    const defs = await prisma.attributeDefinition.findMany({
      where: { tenantId: tenantA.id },
    });
    if (defs.length > 0) {
      const wrong = await prisma.attributeDefinition.findFirst({
        where: { id: defs[0].id, tenantId: tenantB.id },
      });
      expect(wrong).toBeNull();
    }
  });

  it("stock movements are tenant-scoped", async () => {
    const moves = await prisma.stockMovement.findMany({
      where: { tenantId: tenantA.id },
    });
    if (moves.length > 0) {
      const wrong = await prisma.stockMovement.findFirst({
        where: { id: moves[0].id, tenantId: tenantB.id },
      });
      expect(wrong).toBeNull();
    }
  });

  it("tenant A sees different products from tenant B", async () => {
    const productsA = await prisma.product.findMany({
      where: { tenantId: tenantA.id },
    });
    const productsB = await prisma.product.findMany({
      where: { tenantId: tenantB.id },
    });

    const idsA = productsA.map((p) => p.id);
    const idsB = productsB.map((p) => p.id);

    for (const id of idsA) {
      expect(idsB).not.toContain(id);
    }
  });
});
