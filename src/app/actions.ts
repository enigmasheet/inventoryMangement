"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import slugify from "slugify";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

const log = createLogger("actions:createShop");

const createShopSchema = z.object({
  shopName: z.string().min(1, "Shop name is required").max(100),
  category: z.string().min(1, "Category is required"),
});

export async function createShop(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
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

  const tenant = await prisma.tenant.create({
    data: {
      slug,
      shopName: parsed.data.shopName,
      category: parsed.data.category,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { tenantId: tenant.id },
  });

  log.info("shop created", { slug, shopName: parsed.data.shopName });
  redirect(`/${tenant.slug}/dashboard`);
}
