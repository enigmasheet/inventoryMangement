import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/lib/db", () => {
  const fn = () => vi.fn();
  return {
    prisma: {
      tenant: { findUnique: fn(), findFirst: fn(), create: fn(), update: fn() },
      user: { findFirst: fn(), update: fn() },
      product: { findFirst: fn(), findUnique: fn(), create: fn(), update: fn(), delete: fn(), findMany: fn() },
      attributeDefinition: { create: fn(), findFirst: fn(), update: fn(), delete: fn() },
      productAttributeValue: { deleteMany: fn(), createMany: fn() },
      stockMovement: { create: fn(), deleteMany: fn(), findMany: fn() },
      stockTakeItem: { findFirst: fn(), update: fn() },
      $transaction: fn(),
    },
  };
});

class RedirectError extends Error { digest = "NEXT_REDIRECT"; }
const redirectMock = vi.fn(() => { throw new RedirectError(); });
vi.mock("next/navigation", () => ({ redirect: (...a: unknown[]) => redirectMock(...a) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn(() => new Headers()) }));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createShop, joinShopByCode, regenerateInviteCode, getInviteCode, removeMember } from "@/app/actions";
import { createAttribute, updateAttribute, deleteAttributeAction } from "@/app/actions/attributes";
import { createProduct, updateProduct, deleteProduct } from "@/app/actions/products";
import { recordMovement } from "@/app/actions/stock";

const mockTenant = {
  id: "tenant-1", slug: "my-shop", shopName: "My Shop", category: "general",
  inviteCode: "ABC123", createdById: "user-1",
};

const mockProduct = {
  id: "product-1", tenantId: "tenant-1", name: "Widget", sku: "WDG-001",
  unitPrice: 10, costPrice: 5, quantity: 10, lowStockLimit: 3, unit: "pcs",
  createdAt: new Date(),
};

function form(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.append(k, v);
  return fd;
}

beforeEach(() => { vi.clearAllMocks(); });

// ============================================================
// SHOP & INVITE
// ============================================================
describe("createShop", () => {
  it("returns error when no session", async () => {
    auth.api.getSession.mockResolvedValue(null);
    const r = await createShop(null, form({ shopName: "Test", category: "general" }));
    expect(r).toEqual({ error: "Unauthorized" });
  });

  it("returns validation error for empty name", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: null } });
    const r = await createShop(null, form({ shopName: "", category: "general" }));
    expect(r).toMatchObject({ error: expect.any(String) });
  });

  it("creates shop and updates user on success", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "user-1" } });
    prisma.tenant.findUnique.mockResolvedValue(null);
    prisma.tenant.create.mockResolvedValue(mockTenant);
    prisma.user.update.mockResolvedValue({});

    await expect(createShop(null, form({ shopName: "My Shop", category: "general" }))).rejects.toThrow();

    expect(prisma.tenant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: "my-shop", shopName: "My Shop", category: "general",
          createdById: "user-1", inviteCode: expect.any(String),
        }),
      })
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" }, data: { tenantId: "tenant-1" },
    });
  });

  it("handles slug collision", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "user-1" } });
    prisma.tenant.findUnique.mockResolvedValueOnce(mockTenant).mockResolvedValueOnce(null);
    prisma.tenant.create.mockResolvedValue(mockTenant);
    prisma.user.update.mockResolvedValue({});

    await expect(createShop(null, form({ shopName: "My Shop", category: "general" }))).rejects.toThrow();
    const data = prisma.tenant.create.mock.calls[0][0].data;
    expect(data.slug).not.toBe("my-shop");
    expect(data.slug).toMatch(/^my-shop-/);
  });
});

describe("joinShopByCode", () => {
  it("returns error when no session", async () => {
    auth.api.getSession.mockResolvedValue(null);
    expect(await joinShopByCode(null, form({ code: "ABC" }))).toEqual({ error: "Unauthorized" });
  });

  it("returns error when user already has a tenant", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    expect(await joinShopByCode(null, form({ code: "ABC" }))).toEqual({ error: "You already belong to a shop" });
  });

  it("returns error for invalid code", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: null } });
    prisma.tenant.findUnique.mockResolvedValue(null);
    expect(await joinShopByCode(null, form({ code: "INVALID" }))).toEqual({ error: "Invalid invite code. Please check and try again." });
  });

  it("joins shop on valid code", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "user-1", tenantId: null } });
    prisma.tenant.findUnique.mockResolvedValue(mockTenant);
    prisma.user.update.mockResolvedValue({});

    await expect(joinShopByCode(null, form({ code: "ABC123" }))).rejects.toThrow();
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: "user-1" }, data: { tenantId: "tenant-1" } });
  });
});

describe("regenerateInviteCode", () => {
  it("returns error when no session", async () => {
    auth.api.getSession.mockResolvedValue(null);
    expect(await regenerateInviteCode()).toEqual({ error: "Unauthorized" });
  });

  it("returns error when not owner", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.tenant.findFirst.mockResolvedValue(null);
    expect(await regenerateInviteCode()).toEqual({ error: "Only the shop owner can regenerate the invite code" });
  });

  it("returns new code on success", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "user-1", tenantId: "t1" } });
    prisma.tenant.findFirst.mockResolvedValue(mockTenant);
    prisma.tenant.findUnique.mockResolvedValue(null);
    prisma.tenant.update.mockResolvedValue({ ...mockTenant, inviteCode: "XXXXX" });

    const r = await regenerateInviteCode() as { inviteCode: string };
    expect(r.inviteCode).toBeDefined();
    expect(typeof r.inviteCode).toBe("string");
    expect(prisma.tenant.update).toHaveBeenCalled();
  });
});

describe("getInviteCode", () => {
  it("returns error when no session", async () => {
    auth.api.getSession.mockResolvedValue(null);
    expect(await getInviteCode()).toEqual({ error: "Unauthorized" });
  });

  it("returns error when not owner", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.tenant.findFirst.mockResolvedValue(null);
    expect(await getInviteCode()).toEqual({ error: "Only the shop owner can view the invite code" });
  });

  it("returns code for owner", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "user-1", tenantId: "t1" } });
    prisma.tenant.findFirst.mockResolvedValue({ inviteCode: "ABC123" });
    expect(await getInviteCode()).toEqual({ inviteCode: "ABC123" });
  });
});

// ============================================================
// MEMBER MANAGEMENT
// ============================================================
describe("removeMember", () => {
  it("returns error when no session", async () => {
    auth.api.getSession.mockResolvedValue(null);
    expect(await removeMember("user-2")).toEqual({ error: "Unauthorized" });
  });

  it("returns error when not the owner", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "user-2", tenantId: "t1" } });
    prisma.tenant.findFirst.mockResolvedValue({ createdById: "user-1" });
    expect(await removeMember("user-3")).toEqual({ error: "Only the shop owner can remove members" });
  });

  it("returns error when trying to remove self", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "user-1", tenantId: "t1" } });
    prisma.tenant.findFirst.mockResolvedValue({ createdById: "user-1" });
    expect(await removeMember("user-1")).toEqual({ error: "You cannot remove yourself from the shop" });
  });

  it("returns error when target user not in tenant", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "user-1", tenantId: "t1" } });
    prisma.tenant.findFirst.mockResolvedValue({ createdById: "user-1" });
    prisma.user.findFirst.mockResolvedValue(null);
    expect(await removeMember("user-2")).toEqual({ error: "User not found" });
  });

  it("removes member on success", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "user-1", tenantId: "t1" } });
    prisma.tenant.findFirst.mockResolvedValue({ createdById: "user-1" });
    prisma.user.findFirst.mockResolvedValue({ id: "user-2", tenantId: "t1" });
    prisma.user.update.mockResolvedValue({});

    expect(await removeMember("user-2")).toBeNull();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-2" },
      data: { tenantId: null },
    });
    expect(revalidatePath).toHaveBeenCalled();
  });
});

// ============================================================
// ATTRIBUTES
// ============================================================
describe("createAttribute", () => {
  it("returns error when no session", async () => {
    auth.api.getSession.mockResolvedValue(null);
    expect(await createAttribute(null, form({ key: "x", label: "X", type: "text" }))).toEqual({ error: "Unauthorized" });
  });

  it("returns validation error for missing key", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    expect(await createAttribute(null, form({ key: "", label: "X", type: "text" }))).toMatchObject({ error: expect.any(String) });
  });

  it("creates attribute on success", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.tenant.findFirst.mockResolvedValue({ slug: "my-shop" });
    prisma.attributeDefinition.create.mockResolvedValue({});

    const r = await createAttribute(null, form({ key: "size", label: "Size", type: "text" }));
    expect(r).toBeNull();
    expect(prisma.attributeDefinition.create).toHaveBeenCalledWith({
      data: { key: "size", label: "Size", type: "text", tenantId: "t1" },
    });
  });

  it("returns error for duplicate key", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.tenant.findFirst.mockResolvedValue({ slug: "my-shop" });
    prisma.attributeDefinition.create.mockRejectedValue({ code: "P2002" });

    expect(await createAttribute(null, form({ key: "size", label: "Size", type: "text" }))).toEqual(
      { error: expect.stringContaining("already exists") }
    );
  });
});

describe("updateAttribute", () => {
  it("returns error when no session", async () => {
    auth.api.getSession.mockResolvedValue(null);
    expect(await updateAttribute("a1", null, form({ key: "x", label: "X", type: "text" }))).toEqual({ error: "Unauthorized" });
  });

  it("returns not found for cross-tenant", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.attributeDefinition.findFirst.mockResolvedValue(null);
    expect(await updateAttribute("a1", null, form({ key: "x", label: "X", type: "text" }))).toEqual({ error: "Not found" });
  });

  it("updates on success", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.attributeDefinition.findFirst.mockResolvedValue({ id: "a1", tenantId: "t1" });
    prisma.tenant.findFirst.mockResolvedValue({ slug: "my-shop" });
    prisma.attributeDefinition.update.mockResolvedValue({});

    expect(await updateAttribute("a1", null, form({ key: "size", label: "Size", type: "text" }))).toBeNull();
  });
});

describe("deleteAttributeAction", () => {
  it("does not throw on success", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.attributeDefinition.findFirst.mockResolvedValue({ id: "a1", tenantId: "t1", key: "x" });
    prisma.tenant.findFirst.mockResolvedValue({ slug: "my-shop" });
    prisma.$transaction.mockResolvedValue([]);

    await expect(deleteAttributeAction("a1")).resolves.toBeUndefined();
  });
});

// ============================================================
// PRODUCTS
// ============================================================
describe("createProduct", () => {
  it("returns error when no session", async () => {
    auth.api.getSession.mockResolvedValue(null);
    expect(await createProduct("my-shop", null, form({ name: "W", sku: "S", unitPrice: "10" }))).toEqual({ error: "Unauthorized" });
  });

  it("returns error when user has no tenant", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: null } });
    expect(await createProduct("my-shop", null, form({ name: "W", sku: "S", unitPrice: "10" }))).toEqual({ error: "No shop found. Create a shop first." });
  });

  it("returns validation error for missing name", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    expect(await createProduct("my-shop", null, form({ name: "", sku: "S", unitPrice: "10" }))).toMatchObject({ error: expect.any(String) });
  });

  it("creates product on success", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.tenant.findFirst.mockResolvedValue(mockTenant);
    prisma.$transaction.mockImplementation(async (cb: unknown) => {
      if (typeof cb === "function") await cb(prisma);
    });

    await expect(createProduct("my-shop", null, form({ name: "Widget", sku: "WDG-001", unitPrice: "10", quantity: "5", unit: "pcs" }))).rejects.toThrow();
    expect(prisma.tenant.findFirst).toHaveBeenCalledWith({ where: { slug: "my-shop", id: "t1" } });
  });
});

describe("updateProduct", () => {
  it("returns error when no session", async () => {
    auth.api.getSession.mockResolvedValue(null);
    expect(await updateProduct("ms", "p1", null, form({ name: "W", sku: "S", unitPrice: "10" }))).toEqual({ error: "Unauthorized" });
  });

  it("returns not found for cross-tenant", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.product.findFirst.mockResolvedValue(null);
    expect(await updateProduct("ms", "p1", null, form({ name: "W", sku: "S", unitPrice: "10", unit: "pcs" }))).toEqual({ error: "Not found" });
  });

  it("updates on success", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.product.findFirst.mockResolvedValue(mockProduct);
    prisma.tenant.findFirst.mockResolvedValue({ slug: "my-shop" });
    prisma.$transaction.mockImplementation(async (cb: unknown) => {
      if (typeof cb === "function") await cb(prisma);
    });

    await expect(updateProduct("my-shop", "p1", null, form({ name: "W", sku: "S", unitPrice: "12", unit: "pcs" }))).rejects.toThrow();
  });
});

describe("deleteProduct", () => {
  it("returns error when no session", async () => {
    auth.api.getSession.mockResolvedValue(null);
    expect(await deleteProduct("p1", "ms")).toEqual({ error: "Unauthorized" });
  });

  it("returns not found for cross-tenant", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.product.findFirst.mockResolvedValue(null);
    expect(await deleteProduct("p1", "ms")).toEqual({ error: "Not found" });
  });

  it("deletes on success", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.product.findFirst.mockResolvedValue(mockProduct);
    prisma.tenant.findFirst.mockResolvedValue({ slug: "my-shop" });
    prisma.$transaction.mockResolvedValue([]);

    expect(await deleteProduct("p1", "ms")).toBeNull();
    expect(revalidatePath).toHaveBeenCalled();
  });
});

// ============================================================
// STOCK MOVEMENTS
// ============================================================
describe("recordMovement", () => {
  it("returns error when no session", async () => {
    auth.api.getSession.mockResolvedValue(null);
    expect(await recordMovement("ms", "p1", null, form({ type: "IN", quantity: "5" }))).toEqual({ error: "Unauthorized" });
  });

  it("returns not found for cross-tenant product", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.product.findFirst.mockResolvedValue(null);
    expect(await recordMovement("ms", "p1", null, form({ type: "IN", quantity: "5" }))).toEqual({ error: "Not found" });
  });

  it("returns insufficient stock error on OUT", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.product.findFirst.mockResolvedValue(mockProduct);
    prisma.$transaction.mockImplementation(async (cb: unknown) => {
      if (typeof cb === "function") {
        const tx = {
          product: { findUnique: vi.fn().mockResolvedValue({ quantity: 2 }) },
          stockMovement: { create: vi.fn() },
        };
        await cb(tx);
      }
    });

    expect(await recordMovement("ms", "p1", null, form({ type: "OUT", quantity: "10", note: "" }))).toMatchObject({
      error: expect.stringContaining("Insufficient"),
    });
  });

  it("records IN movement on success", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.product.findFirst.mockResolvedValue(mockProduct);
    prisma.$transaction.mockImplementation(async (cb: unknown) => {
      if (typeof cb === "function") {
        const tx = {
          product: { findUnique: vi.fn().mockResolvedValue({ quantity: 10 }), update: vi.fn() },
          stockMovement: { create: vi.fn() },
        };
        await cb(tx);
      }
    });

    expect(await recordMovement("ms", "p1", null, form({ type: "IN", quantity: "5", note: "" }))).toBeNull();
    expect(revalidatePath).toHaveBeenCalled();
  });

  it("records OUT movement on success", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.product.findFirst.mockResolvedValue(mockProduct);
    prisma.$transaction.mockImplementation(async (cb: unknown) => {
      if (typeof cb === "function") {
        const tx = {
          product: { findUnique: vi.fn().mockResolvedValue({ quantity: 10 }), update: vi.fn() },
          stockMovement: { create: vi.fn() },
        };
        await cb(tx);
      }
    });

    expect(await recordMovement("ms", "p1", null, form({ type: "OUT", quantity: "3", note: "" }))).toBeNull();
  });

  it("returns validation error for negative quantity", async () => {
    auth.api.getSession.mockResolvedValue({ user: { id: "u1", tenantId: "t1" } });
    prisma.product.findFirst.mockResolvedValue(mockProduct);
    expect(await recordMovement("ms", "p1", null, form({ type: "IN", quantity: "-1" }))).toMatchObject({
      error: expect.any(String),
    });
  });
});
