"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

const log = createLogger("actions:attributes");

const createAttributeSchema = z.object({
  key: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  type: z.enum(["text", "number", "date"]),
});

export async function createAttribute(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
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
  return null;
}

export async function updateAttribute(
  attributeId: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
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
  return null;
}

export async function deleteAttribute(attributeId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.tenantId) {
    log.warn("deleteAttribute rejected — no session");
    throw new Error("Unauthorized");
  }

  const def = await prisma.attributeDefinition.findFirst({
    where: { id: attributeId, tenantId: session.user.tenantId },
  });
  if (!def) {
    log.warn("deleteAttribute rejected — not found in tenant scope", { attributeId });
    throw new Error("Not found");
  }

  await prisma.$transaction([
    prisma.productAttributeValue.deleteMany({
      where: { attributeDefId: attributeId },
    }),
    prisma.attributeDefinition.delete({ where: { id: attributeId } }),
  ]);

  log.info("attribute definition deleted", { attributeId, key: def.key });
}
