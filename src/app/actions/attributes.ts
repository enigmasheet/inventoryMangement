"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { ATTRIBUTE_TYPES } from "@/lib/constants";

const log = createLogger("actions:attributes");

const createAttributeSchema = z.object({
  key: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  type: z.enum(ATTRIBUTE_TYPES),
});

export async function createAttribute(
  tenantSlug: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await getSession();
  if (!session?.user.tenantId) {
    log.warn("createAttribute rejected — no session");
    return { error: "Unauthorized" };
  }

  const parsed = createAttributeSchema.safeParse({
    key: formData.get("key"),
    label: formData.get("label"),
    type: formData.get("type"),
  });
  if (!parsed.success) {
    log.warn("createAttribute validation failed", parsed.error.issues[0]);
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.attributeDefinition.create({
      data: { ...parsed.data, tenantId: session.user.tenantId },
    });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
      return { error: `A field with key "${parsed.data.key}" already exists` };
    }
    log.error("createAttribute db error", e);
    return { error: "Failed to create attribute" };
  }

  log.info("attribute definition created", { key: parsed.data.key, label: parsed.data.label });
  revalidatePath(`/${tenantSlug}/settings`);
  return null;
}

export async function updateAttribute(
  tenantSlug: string,
  attributeId: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await getSession();
  if (!session?.user.tenantId) {
    log.warn("updateAttribute rejected — no session");
    return { error: "Unauthorized" };
  }

  const def = await prisma.attributeDefinition.findFirst({
    where: { id: attributeId, tenantId: session.user.tenantId },
  });
  if (!def) {
    log.warn("updateAttribute rejected — not found in tenant scope", { attributeId });
    return { error: "Not found" };
  }

  const parsed = createAttributeSchema.safeParse({
    key: formData.get("key"),
    label: formData.get("label"),
    type: formData.get("type"),
  });
  if (!parsed.success) {
    log.warn("updateAttribute validation failed", parsed.error.issues[0]);
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.attributeDefinition.update({
      where: { id: attributeId },
      data: parsed.data,
    });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
      return { error: `A field with key "${parsed.data.key}" already exists` };
    }
    log.error("updateAttribute db error", e);
    return { error: "Failed to update attribute" };
  }

  log.info("attribute definition updated", { attributeId, key: parsed.data.key });
  revalidatePath(`/${tenantSlug}/settings`);
  return null;
}

async function _deleteAttribute(tenantSlug: string, attributeId: string): Promise<{ error?: string } | null> {
  const session = await getSession();
  if (!session?.user.tenantId) {
    log.warn("deleteAttribute rejected — no session");
    return { error: "Unauthorized" };
  }

  const def = await prisma.attributeDefinition.findFirst({
    where: { id: attributeId, tenantId: session.user.tenantId },
  });
  if (!def) {
    log.warn("deleteAttribute rejected — not found in tenant scope", { attributeId });
    return { error: "Not found" };
  }

  await prisma.$transaction([
    prisma.productAttributeValue.deleteMany({
      where: { attributeDefId: attributeId },
    }),
    prisma.attributeDefinition.delete({ where: { id: attributeId } }),
  ]);

  log.info("attribute definition deleted", { attributeId, key: def.key });
  revalidatePath(`/${tenantSlug}/settings`);
  return null;
}

export async function deleteAttributeAction(
  tenantSlug: string,
  attributeId: string
): Promise<{ error?: string } | null> {
  return _deleteAttribute(tenantSlug, attributeId);
}
