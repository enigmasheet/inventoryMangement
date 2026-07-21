"use server";

import { randomBytes } from "crypto";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

const log = createLogger("actions:createShop");

function generateInviteCode(): string {
  return randomBytes(5).toString("hex").toUpperCase();
}

const createShopSchema = z.object({
  shopName: z.string().min(1, "Shop name is required").max(100),
  category: z.string().min(1, "Category is required"),
});

export async function createShop(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await getSession();
  if (!session?.user) {
    log.warn("createShop rejected — no session");
    return { error: "Unauthorized" };
  }

  const parsed = createShopSchema.safeParse({
    shopName: formData.get("shopName"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    log.warn("createShop validation failed", parsed.error.issues[0]);
    return { error: parsed.error.issues[0].message };
  }

  let slug = slugify(parsed.data.shopName, { lower: true, strict: true });
  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    log.info("slug collision resolved", { original: slugify(parsed.data.shopName, { lower: true, strict: true }), resolved: slug });
  }

  let inviteCode = generateInviteCode();
  while (await prisma.tenant.findUnique({ where: { inviteCode } })) {
    inviteCode = generateInviteCode();
  }

  const tenant = await prisma.tenant.create({
    data: {
      slug,
      shopName: parsed.data.shopName,
      category: parsed.data.category,
      inviteCode,
      createdById: session.user.id,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { tenantId: tenant.id },
  });

  log.info("shop created", { slug, shopName: parsed.data.shopName, inviteCode });
  redirect(`/${tenant.slug}/dashboard`);
}

const joinShopSchema = z.object({
  code: z.string().min(1, "Invite code is required").max(10),
});

export async function joinShopByCode(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await getSession();
  if (!session?.user) {
    log.warn("joinShop rejected — no session");
    return { error: "Unauthorized" };
  }

  if (session.user.tenantId) {
    log.warn("joinShop rejected — user already has a shop");
    return { error: "You already belong to a shop" };
  }

  const parsed = joinShopSchema.safeParse({
    code: formData.get("code"),
  });
  if (!parsed.success) {
    log.warn("joinShop validation failed", parsed.error.issues[0]);
    return { error: parsed.error.issues[0].message };
  }

  const code = parsed.data.code.toUpperCase();
  const tenant = await prisma.tenant.findUnique({ where: { inviteCode: code } });
  if (!tenant) {
    log.warn("joinShop rejected — invalid invite code", { code });
    return { error: "Invalid invite code. Please check and try again." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { tenantId: tenant.id },
  });

  log.info("user joined shop", { userId: session.user.id, tenantId: tenant.id, shopName: tenant.shopName });
  redirect(`/${tenant.slug}/dashboard`);
}

export async function regenerateInviteCode(): Promise<{ error?: string; inviteCode?: string } | null> {
  const session = await getSession();
  if (!session?.user?.tenantId) {
    log.warn("regenerateInviteCode rejected — no session or tenant");
    return { error: "Unauthorized" };
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id: session.user.tenantId, createdById: session.user.id },
  });
  if (!tenant) {
    log.warn("regenerateInviteCode rejected — not the owner");
    return { error: "Only the shop owner can regenerate the invite code" };
  }

  let inviteCode = generateInviteCode();
  while (await prisma.tenant.findUnique({ where: { inviteCode } })) {
    inviteCode = generateInviteCode();
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { inviteCode },
  });

  log.info("invite code regenerated", { tenantId: tenant.id, inviteCode });
  return { inviteCode };
}

export async function removeMember(
  userId: string
): Promise<{ error?: string } | null> {
  const session = await getSession();
  if (!session?.user?.tenantId) {
    log.warn("removeMember rejected — no session");
    return { error: "Unauthorized" };
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id: session.user.tenantId },
    select: { createdById: true, slug: true },
  });
  if (!tenant || tenant.createdById !== session.user.id) {
    log.warn("removeMember rejected — not the owner");
    return { error: "Only the shop owner can remove members" };
  }

  if (userId === session.user.id) {
    log.warn("removeMember rejected — cannot remove self");
    return { error: "You cannot remove yourself from the shop" };
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, tenantId: session.user.tenantId },
  });
  if (!target) {
    log.warn("removeMember rejected — user not found in tenant scope", { userId });
    return { error: "User not found" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { tenantId: null },
  });

  log.info("member removed", { userId, tenantId: session.user.tenantId });
  revalidatePath(`/${tenant.slug}/settings`);
  return null;
}

export async function toggleFinancials(
  showFinancials: boolean
): Promise<{ error?: string; showFinancials?: boolean } | null> {
  const session = await getSession();
  if (!session?.user?.tenantId) {
    log.warn("toggleFinancials rejected — no session");
    return { error: "Unauthorized", showFinancials };
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id: session.user.tenantId, createdById: session.user.id },
    select: { id: true, slug: true },
  });
  if (!tenant) {
    log.warn("toggleFinancials rejected — not the owner");
    return { error: "Only the shop owner can change this setting", showFinancials };
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { showFinancials },
  });

  log.info("showFinancials toggled", { tenantId: tenant.id, showFinancials });
  revalidatePath(`/${tenant.slug}/settings`);
  revalidatePath(`/${tenant.slug}/products`);
  revalidatePath(`/${tenant.slug}/dashboard`);
  return { showFinancials };
}

export async function getInviteCode(): Promise<{ error?: string; inviteCode?: string | null } | null> {
  const session = await getSession();
  if (!session?.user?.tenantId) {
    return { error: "Unauthorized" };
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id: session.user.tenantId, createdById: session.user.id },
    select: { inviteCode: true },
  });
  if (!tenant) {
    return { error: "Only the shop owner can view the invite code" };
  }

  return { inviteCode: tenant.inviteCode };
}
