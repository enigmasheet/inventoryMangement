import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { createProduct } from "@/app/actions/products";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.tenantId) redirect("/");

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, id: session.user.tenantId },
  });
  if (!tenant) redirect("/");

  const attrDefs = await prisma.attributeDefinition.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, key: true, label: true, type: true },
  });

  const createWithSlug = createProduct.bind(null, tenantSlug);

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">New Product</h2>
      <ProductForm attributeDefs={attrDefs} action={createWithSlug} />
    </div>
  );
}
