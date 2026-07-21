"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createLogger } from "@/lib/logger";
import { STOCK_TAKE_STATUS } from "@/lib/constants";

const log = createLogger("actions:stock-take-core");

export async function _startStockTake(
  tenantSlug: string,
  note?: string
): Promise<{ error?: string; stockTakeId?: string } | null> {
  const session = await getSession();
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

  let stockTake;
  try {
    stockTake = await prisma.$transaction(async (tx) => {
      const existingActive = await tx.stockTake.findFirst({
        where: { tenantId: tenant.id, status: STOCK_TAKE_STATUS.IN_PROGRESS },
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
          status: STOCK_TAKE_STATUS.IN_PROGRESS,
          items: {
            create: products.map((p) => ({
              productId: p.id,
              expectedQuantity: p.quantity,
            })),
          },
        },
      });
    });
  } catch (e: unknown) {
    if (e instanceof Error) return { error: e.message };
    throw e;
  }

  log.info("stock take started", { stockTakeId: stockTake.id });
  revalidatePath(`/${tenantSlug}/dashboard`);
  redirect(`/${tenantSlug}/stock-take/${stockTake.id}`);
}

export async function completeStockTake(
  stockTakeId: string,
  applyAdjustments: boolean
): Promise<{ tenantSlug?: string; error?: string } | null> {
  const session = await getSession();
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
  if (stockTake.status !== STOCK_TAKE_STATUS.IN_PROGRESS) {
    return { error: "Stock take is already completed" };
  }

  const uncounted = stockTake.items.filter((i) => i.countedQuantity === null).length;
  if (uncounted > 0) {
    return { error: `Cannot complete — ${uncounted} item(s) not yet counted` };
  }

  await prisma.$transaction(async (tx) => {
    if (applyAdjustments) {
      const discrepantIds = stockTake.items
        .filter((i) => i.countedQuantity !== null && i.countedQuantity !== i.expectedQuantity)
        .map((i) => i.productId);

      if (discrepantIds.length > 0) {
        const currentProducts = await tx.product.findMany({
          where: { id: { in: discrepantIds } },
          select: { id: true, quantity: true },
        });
        const productMap = new Map(currentProducts.map((p) => [p.id, p.quantity]));

        for (const item of stockTake.items) {
          if (item.countedQuantity === null || item.countedQuantity === item.expectedQuantity) continue;
          const currentQty = productMap.get(item.productId);
          if (currentQty === undefined) continue;
          const diff = item.countedQuantity - currentQty;
          if (diff !== 0) {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { increment: diff } },
            });
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
    }

    await tx.stockTake.update({
      where: { id: stockTakeId },
      data: { status: STOCK_TAKE_STATUS.COMPLETED, completedAt: new Date() },
    });
  });

  log.info("stock take completed", { stockTakeId, applyAdjustments });
  const slug = stockTake.tenant.slug;
  revalidatePath(`/${slug}/dashboard`);
  revalidatePath(`/${slug}/stock-take`);
  revalidatePath(`/${slug}/stock-take/${stockTakeId}`);
  return { tenantSlug: slug };
}

export async function _cancelStockTake(stockTakeId: string): Promise<{ error?: string } | null> {
  const session = await getSession();
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
  if (stockTake.status !== STOCK_TAKE_STATUS.IN_PROGRESS) {
    return { error: "Stock take is not active" };
  }

  await prisma.stockTake.update({
    where: { id: stockTakeId },
    data: { status: STOCK_TAKE_STATUS.CANCELLED },
  });

  log.info("stock take cancelled", { stockTakeId });
  const slug = stockTake.tenant.slug;
  revalidatePath(`/${slug}/dashboard`);
  revalidatePath(`/${slug}/stock-take`);
  revalidatePath(`/${slug}/stock-take/${stockTakeId}`);
  return null;
}
