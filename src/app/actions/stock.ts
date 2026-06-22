"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { MOVEMENT_TYPES } from "@/lib/constants";

const log = createLogger("actions:stock");

const movementSchema = z.object({
  type: z.enum(MOVEMENT_TYPES),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  note: z.string().max(500).optional(),
});

export async function recordMovement(
  tenantSlug: string,
  productId: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await getSession();
  if (!session?.user.tenantId) {
    log.warn("recordMovement rejected — no tenant");
    return { error: "Unauthorized" };
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: session.user.tenantId },
  });
  if (!product) {
    log.warn("recordMovement rejected — product not found in tenant scope", { productId });
    return { error: "Not found" };
  }

  const parsed = movementSchema.safeParse({
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    log.warn("recordMovement validation failed", parsed.error.issues[0]);
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (parsed.data.type === "OUT") {
        const current = await tx.product.findUnique({
          where: { id: productId },
          select: { quantity: true },
        });
        if (!current || current.quantity < parsed.data.quantity) {
          throw new Error(`Insufficient stock. Available: ${current?.quantity ?? 0}`);
        }
      }

      await tx.stockMovement.create({
        data: {
          tenantId: session.user.tenantId!,
          productId,
          type: parsed.data.type,
          quantity: parsed.data.quantity,
          note: parsed.data.note || null,
        },
      });
      await tx.product.update({
        where: { id: productId },
        data: {
          quantity:
            parsed.data.type === "IN"
              ? { increment: parsed.data.quantity }
              : { decrement: parsed.data.quantity },
        },
      });
    });
  } catch (e: unknown) {
    if (e instanceof Error) return { error: e.message };
    throw e;
  }

  log.info("movement recorded", { productId, type: parsed.data.type, quantity: parsed.data.quantity });
  revalidatePath(`/${tenantSlug}/products/${productId}`);
  revalidatePath(`/${tenantSlug}/dashboard`);
  return null;
}
