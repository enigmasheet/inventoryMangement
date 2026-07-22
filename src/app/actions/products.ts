"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { PRODUCT_UNITS } from "@/lib/constants";

const log = createLogger("actions:products");

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  sku: z.string().min(1, "SKU is required").max(50),
  unitPrice: z.coerce.number().min(0),
  costPrice: z.coerce.number().min(0).default(0),
  quantity: z.coerce.number().int().min(0).default(0),
  lowStockLimit: z.coerce.number().int().min(0).default(5),
  unit: z.enum(PRODUCT_UNITS).default("pcs"),
});

function extractFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    sku: formData.get("sku"),
    unitPrice: formData.get("unitPrice"),
    costPrice: formData.get("costPrice"),
    quantity: formData.get("quantity"),
    lowStockLimit: formData.get("lowStockLimit"),
    unit: formData.get("unit"),
  };
}

export async function createProduct(
  tenantSlug: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await getSession();
  if (!session?.user) {
    log.warn("createProduct rejected — no session");
    return { error: "Unauthorized" };
  }
  if (!session.user.tenantId) {
    log.warn("createProduct rejected — no tenant");
    return { error: "No shop found. Create a shop first." };
  }

  const parsed = productSchema.safeParse(extractFormData(formData));
  if (!parsed.success) {
    log.warn("createProduct validation failed", parsed.error.issues[0]);
    return { error: parsed.error.issues[0].message };
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, id: session.user.tenantId },
  });
  if (!tenant) {
    log.warn("createProduct rejected — tenant not found", { tenantSlug });
    return { error: "Not found" };
  }

  const attrs: { attributeDefId: string; value: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("attr_") && typeof value === "string" && value) {
      attrs.push({ attributeDefId: key.slice(5), value });
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.create({
        data: {
          tenantId: tenant.id,
          ...parsed.data,
          attributes: { create: attrs },
        },
        select: { id: true },
      });
    });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
      return { error: `A product with SKU "${parsed.data.sku}" already exists` };
    }
    throw e;
  }

  log.info("product created", { name: parsed.data.name, sku: parsed.data.sku });
  redirect(`/${tenant.slug}/products`);
}

export async function updateProduct(
  tenantSlug: string,
  productId: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await getSession();
  if (!session?.user) {
    log.warn("updateProduct rejected — no session");
    return { error: "Unauthorized" };
  }
  if (!session.user.tenantId) {
    log.warn("updateProduct rejected — no tenant");
    return { error: "No shop found. Create a shop first." };
  }

  const parsed = productSchema.safeParse(extractFormData(formData));
  if (!parsed.success) {
    log.warn("updateProduct validation failed", parsed.error.issues[0]);
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.product.findFirst({
    where: { id: productId, tenantId: session.user.tenantId },
  });
  if (!existing) {
    log.warn("updateProduct rejected — not found in tenant scope", { productId });
    return { error: "Not found" };
  }

  const attrs: { attributeDefId: string; value: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("attr_") && typeof value === "string") {
      attrs.push({ attributeDefId: key.slice(5), value });
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: parsed.data,
        select: { id: true },
      });

      await tx.productAttributeValue.deleteMany({
        where: { productId },
      });

      if (attrs.length > 0) {
        await tx.productAttributeValue.createMany({
          data: attrs.map((a) => ({
            productId,
            attributeDefId: a.attributeDefId,
            value: a.value,
          })),
        });
      }
    });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
      return { error: `A product with SKU "${parsed.data.sku}" already exists` };
    }
    throw e;
  }

  log.info("product updated", { productId, name: parsed.data.name });
  redirect(`/${tenantSlug}/products`);
}

export async function deleteProduct(productId: string, tenantSlug: string): Promise<{ error?: string } | null> {
  const session = await getSession();
  if (!session?.user) {
    log.warn("deleteProduct rejected — no session");
    return { error: "Unauthorized" };
  }
  if (!session.user.tenantId) {
    log.warn("deleteProduct rejected — no tenant");
    return { error: "No shop found." };
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: session.user.tenantId },
  });
  if (!product) {
    log.warn("deleteProduct rejected — not found in tenant scope", { productId });
    return { error: "Not found" };
  }

  await prisma.product.delete({ where: { id: productId } });

  log.info("product deleted", { productId, name: product.name });
  revalidatePath(`/${tenantSlug}/products`);
  revalidatePath(`/${tenantSlug}/dashboard`);
  updateTag("dashboard-metrics");
  updateTag("dashboard-low-stock");
  return null;
}
