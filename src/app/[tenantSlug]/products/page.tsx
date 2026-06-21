import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Plus, Search } from "lucide-react";
import { ProductList } from "@/components/product-list";

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { tenantSlug } = await params;
  const { q } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.tenantId) redirect("/");

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, id: session.user.tenantId },
  });
  if (!tenant) redirect("/");

  const where = {
    tenantId: tenant.id,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-heading font-bold text-lg tracking-wider uppercase">
            Products
          </h1>
          <span className="text-[11px] font-mono text-muted-foreground" data-number>
            {products.length}
          </span>
        </div>
        <Link
          href={`/${tenantSlug}/products/new`}
          className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider hover:brightness-110 transition-all"
        >
          <Plus className="size-3.5" />
          New Product
        </Link>
      </div>

      <form className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name or SKU..."
          className="w-full h-9 bg-card border pl-9 pr-3 text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </form>

      <ProductList tenantSlug={tenantSlug} products={products} />
    </div>
  );
}
