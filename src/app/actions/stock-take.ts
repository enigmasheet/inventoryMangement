"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

const log = createLogger("actions:stock-take");

async function _startStockTake(
  tenantSlug: string,
  note?: string
): Promise<{ error?: string; stockTakeId?: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.tenantId) {
    log.warn("startStockTake rejected — no session");
    return { error: "Unauthorized" };
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, id: session.user.tenantId },
  });
  if (!tenant) {
    log.warn("startStockTake rejected — tenant not found");
    return { error: "Not found" };
  }

  const stockTake = await prisma.$transaction(async (tx) => {
    const existingActive = await tx.stockTake.findFirst({
      where: { tenantId: tenant.id, status: "in_progress" },
    });
    if (existingActive) {
      throw new Error("An active stock take already exists");
    }

    const products = await tx.product.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, quantity: true },
    });
    if (products.length === 0) {
      throw new Error("No products to count");
    }

    return tx.stockTake.create({
      data: {
        tenantId: tenant.id,
        note: note || null,
        status: "in_progress",
        items: {
          create: products.map((p) => ({
            productId: p.id,
            expectedQuantity: p.quantity,
          })),
        },
      },
    });
  });

  log.info("stock take started", { stockTakeId: stockTake.id });
  revalidatePath(`/${tenantSlug}/dashboard`);
  redirect(`/${tenantSlug}/stock-take/${stockTake.id}`);
}

const updateItemSchema = z.object({
  countedQuantity: z.coerce.number().int().min(0),
});

export async function updateStockTakeItem(
  tenantSlug: string,
  itemId: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.tenantId) {
    return { error: "Unauthorized" };
  }

  const parsed = updateItemSchema.safeParse({
    countedQuantity: formData.get("countedQuantity"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const item = await prisma.stockTakeItem.findFirst({
    where: { id: itemId },
    include: { stockTake: { select: { id: true, tenantId: true, status: true } } },
  });
  if (!item || item.stockTake.tenantId !== session.user.tenantId) {
    return { error: "Not found" };
  }
  if (item.stockTake.status !== "in_progress") {
    return { error: "Stock take is not active" };
  }

  await prisma.stockTakeItem.update({
    where: { id: itemId },
    data: { countedQuantity: parsed.data.countedQuantity },
  });

  log.info("stock take item updated", { itemId, countedQuantity: parsed.data.countedQuantity });
  revalidatePath(`/${tenantSlug}/stock-take/${item.stockTake.id}`);
  revalidatePath(`/${tenantSlug}/stock-take`);
  return null;
}

export async function completeStockTake(
  stockTakeId: string,
  applyAdjustments: boolean
): Promise<{ tenantSlug?: string; error?: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.tenantId) {
    return { error: "Unauthorized" };
  }

  const stockTake = await prisma.stockTake.findFirst({
    where: { id: stockTakeId, tenantId: session.user.tenantId },
    include: { items: true, tenant: { select: { slug: true } } },
  });
  if (!stockTake) {
    return { error: "Not found" };
  }
  if (stockTake.status !== "in_progress") {
    return { error: "Stock take is already completed" };
  }

  const uncounted = stockTake.items.filter((i) => i.countedQuantity === null).length;
  if (uncounted > 0) {
    return { error: `Cannot complete — ${uncounted} item(s) not yet counted` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockTake.update({
      where: { id: stockTakeId },
      data: { status: "completed", completedAt: new Date() },
    });

    if (applyAdjustments) {
      for (const item of stockTake.items) {
        if (item.countedQuantity !== null && item.countedQuantity !== item.expectedQuantity) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: item.countedQuantity },
          });
          const diff = item.countedQuantity - item.expectedQuantity;
          await tx.stockMovement.create({
            data: {
              tenantId: stockTake.tenantId,
              productId: item.productId,
              type: diff > 0 ? "IN" : "OUT",
              quantity: Math.abs(diff),
              note: `Stock take adjustment (${stockTakeId.slice(0, 8)})`,
            },
          });
        }
      }
    }
  });

  log.info("stock take completed", { stockTakeId, applyAdjustments });
  const slug = stockTake.tenant.slug;
  revalidatePath(`/${slug}/dashboard`);
  revalidatePath(`/${slug}/stock-take`);
  revalidatePath(`/${slug}/stock-take/${stockTakeId}`);
  return { tenantSlug: slug };
}

export async function completeStockTakeAction(
  tenantSlug: string,
  stockTakeId: string,
  applyAdjustments: boolean
): Promise<void> {
  const result = await completeStockTake(stockTakeId, applyAdjustments);
  if (result?.error) {
    redirect(`/${tenantSlug}/stock-take/${stockTakeId}?error=${encodeURIComponent(result.error)}`);
  }
}

export async function startStockTakeAction(tenantSlug: string): Promise<void> {
  const result = await _startStockTake(tenantSlug);
  if (result?.error) {
    redirect(`/${tenantSlug}/stock-take?error=${encodeURIComponent(result.error)}`);
  }
}

export async function cancelStockTakeAction(tenantSlug: string, stockTakeId: string): Promise<void> {
  const result = await _cancelStockTake(stockTakeId);
  if (result?.error) {
    redirect(`/${tenantSlug}/stock-take/${stockTakeId}?error=${encodeURIComponent(result.error)}`);
  }
}

async function _cancelStockTake(stockTakeId: string): Promise<{ error?: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.tenantId) {
    return { error: "Unauthorized" };
  }

  const stockTake = await prisma.stockTake.findFirst({
    where: { id: stockTakeId, tenantId: session.user.tenantId },
    include: { tenant: { select: { slug: true } } },
  });
  if (!stockTake) {
    return { error: "Not found" };
  }
  if (stockTake.status !== "in_progress") {
    return { error: "Stock take is not active" };
  }

  await prisma.stockTake.update({
    where: { id: stockTakeId },
    data: { status: "cancelled", completedAt: new Date() },
  });

  log.info("stock take cancelled", { stockTakeId });
  const slug = stockTake.tenant.slug;
  revalidatePath(`/${slug}/dashboard`);
  revalidatePath(`/${slug}/stock-take`);
  revalidatePath(`/${slug}/stock-take/${stockTakeId}`);
  return null;
}
