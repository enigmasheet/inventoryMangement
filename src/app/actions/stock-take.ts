"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { STOCK_TAKE_STATUS } from "@/lib/constants";
import { _startStockTake, completeStockTake, _cancelStockTake } from "./stock-take-core";

const log = createLogger("actions:stock-take");

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
    where: { id: itemId, stockTake: { tenantId: session.user.tenantId } },
    include: { stockTake: { select: { id: true, status: true } } },
  });
  if (!item) {
    return { error: "Not found" };
  }
  if (item.stockTake.status !== STOCK_TAKE_STATUS.IN_PROGRESS) {
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

export async function completeStockTakeAction(
  tenantSlug: string,
  stockTakeId: string,
  applyAdjustments: boolean
): Promise<void> {
  const result = await completeStockTake(stockTakeId, applyAdjustments);
  if (result?.error) {
    redirect(`/${tenantSlug}/stock-take/${stockTakeId}?error=${encodeURIComponent(result.error)}`);
  }
  if (result?.tenantSlug) {
    redirect(`/${result.tenantSlug}/stock-take`);
  }
}

export async function startStockTakeAction(tenantSlug: string): Promise<void> {
  const result = await _startStockTake(tenantSlug);
  if (result?.error) {
    redirect(`/${tenantSlug}/stock-take?error=${encodeURIComponent(result.error)}`);
  }
}

export async function cancelStockTakeAction(tenantSlug: string, stockTakeId: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.tenantId) {
    redirect(`/${tenantSlug}/stock-take/${stockTakeId}?error=${encodeURIComponent("Unauthorized")}`);
    return;
  }
  const tenant = await prisma.tenant.findFirst({
    where: { id: session.user.tenantId },
    select: { slug: true },
  });
  if (!tenant) {
    redirect(`/${tenantSlug}/stock-take/${stockTakeId}?error=${encodeURIComponent("Not found")}`);
    return;
  }
  const result = await _cancelStockTake(stockTakeId);
  if (result?.error) {
    redirect(`/${tenant.slug}/stock-take/${stockTakeId}?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/${tenant.slug}/stock-take`);
}
