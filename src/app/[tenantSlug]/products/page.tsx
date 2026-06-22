import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Search, Download } from "lucide-react";
import { ProductList } from "@/components/product-list";
import { ProductPagination } from "@/components/product-pagination";

const PER_PAGE = 20;

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { tenantSlug } = await params;
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
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

  const [rawProducts, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.product.count({ where }),
  ]);

  const canViewCost = tenant.showFinancials || session.user.id === tenant.createdById;

  const products = rawProducts.map((p) => ({
    ...p,
    unitPrice: Number(p.unitPrice),
    costPrice: Number(p.costPrice),
  }));

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-heading font-bold text-lg tracking-wider uppercase">
            Products
          </h1>
          <span className="text-[11px] font-mono text-muted-foreground" data-number>
            {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            download
            href={`/api/export/products/${tenantSlug}`}
            className="inline-flex items-center gap-1.5 border bg-card px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </a>
          <Link
            href={`/${tenantSlug}/products/new`}
            className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider hover:brightness-110 transition-all"
          >
            <Plus className="size-3.5" />
            New Product
          </Link>
        </div>
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

      <ProductList tenantSlug={tenantSlug} currency={tenant.currency} products={products} canViewCost={canViewCost} />

      <ProductPagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={`/${tenantSlug}/products`}
        searchQuery={q ?? ""}
      />
    </div>
  );
}
