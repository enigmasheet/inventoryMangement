import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { updateProduct } from "@/app/actions/products";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; productId: string }>;
}) {
  const { tenantSlug, productId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.tenantId) redirect("/");

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, id: session.user.tenantId },
  });
  if (!tenant) redirect("/");

  const rawProduct = await prisma.product.findFirst({
    where: { id: productId, tenantId: tenant.id },
    include: {
      attributes: {
        include: { attributeDef: { select: { id: true } } },
      },
    },
  });
  if (!rawProduct) notFound();

  const product = {
    ...rawProduct,
    unitPrice: Number(rawProduct.unitPrice),
    costPrice: Number(rawProduct.costPrice),
  };

  const attrDefs = await prisma.attributeDefinition.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, key: true, label: true, type: true },
  });

  const updateWithSlug = updateProduct.bind(null, tenantSlug, productId);

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">Edit Product</h2>
      <ProductForm
        attributeDefs={attrDefs}
        product={product}
        action={updateWithSlug}
      />
    </div>
  );
}
