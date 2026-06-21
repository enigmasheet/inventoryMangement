"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

const log = createLogger("actions:stock");

const movementSchema = z.object({
  type: z.enum(["IN", "OUT"]),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  note: z.string().max(500).optional(),
});

export async function recordMovement(
  tenantSlug: string,
  productId: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
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

  if (parsed.data.type === "OUT" && product.quantity < parsed.data.quantity) {
    log.warn("recordMovement rejected — insufficient stock", { available: product.quantity, requested: parsed.data.quantity });
    return { error: `Insufficient stock. Available: ${product.quantity}` };
  }

  await prisma.$transaction(async (tx) => {
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

  log.info("movement recorded", { productId, type: parsed.data.type, quantity: parsed.data.quantity });
  revalidatePath(`/${tenantSlug}/products/${productId}`);
  return null;
}
