import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Package, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { StockTakeCard } from "@/components/dashboard/stock-take-card";
import { ExpiringProducts } from "@/components/dashboard/expiring-products";
import { LowStockProducts } from "@/components/dashboard/low-stock-products";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user.tenantId) {
    redirect("/");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });
  if (!tenant || tenant.id !== session.user.tenantId) {
    redirect("/");
  }

  const [productCount, lowStockResult, stockValueResult, profitResult, activeStockTake] =
    await Promise.all([
      prisma.product.count({ where: { tenantId: tenant.id } }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count FROM "Product"
        WHERE "tenantId" = ${tenant.id} AND "quantity" <= "lowStockLimit"
      `,
      prisma.$queryRaw<[{ total: string | null }]>`
        SELECT SUM(quantity * "unitPrice")::numeric(65,2) as total FROM "Product"
        WHERE "tenantId" = ${tenant.id}
      `,
      prisma.$queryRaw<[{ total: string | null }]>`
        SELECT SUM(quantity * ("unitPrice" - "costPrice"))::numeric(65,2) as total FROM "Product"
        WHERE "tenantId" = ${tenant.id}
      `,
      prisma.stockTake.findFirst({
        where: { tenantId: tenant.id, status: "in_progress" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const lowStockCount = Number(lowStockResult[0].count);
  const stockValue = stockValueResult[0].total;
  const totalProfit = profitResult[0].total;

  const [lowStockProducts, expiringProducts] = await Promise.all([
    prisma.$queryRaw<
      { id: string; name: string; sku: string; quantity: number; lowStockLimit: number; unit: string }[]
    >`
      SELECT id, name, sku, quantity, "lowStockLimit", unit FROM "Product"
      WHERE "tenantId" = ${tenant.id} AND "quantity" <= "lowStockLimit"
      ORDER BY quantity ASC LIMIT 10
    `,
    prisma.$queryRaw<
      { id: string; name: string; sku: string; expiryDate: Date }[]
    >`
      SELECT p.id, p.name, p.sku, pav.value::date as "expiryDate"
      FROM "ProductAttributeValue" pav
      JOIN "AttributeDefinition" ad ON ad.id = pav."attributeDefId"
      JOIN "Product" p ON p.id = pav."productId"
      WHERE p."tenantId" = ${tenant.id}
        AND ad.type = 'date'
        AND pav.value IS NOT NULL
        AND pav.value ~ '^\d{4}-\d{2}-\d{2}$'
        AND pav.value::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      ORDER BY pav.value::date ASC
      LIMIT 10
    `,
  ]);

  const formatCurrency = (v: string | null) =>
    `${tenant.currency}${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="font-heading font-bold text-lg tracking-wider uppercase">Dashboard</h1>
        <span className="text-[11px] font-sans text-muted-foreground">{session.user.name}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Products"
          value={productCount}
          icon={<Package className="size-5" />}
          color="text-primary"
        />
        <MetricCard
          label="Low Stock Items"
          value={lowStockCount}
          icon={<AlertTriangle className="size-5" />}
          color="text-warning"
        />
        <MetricCard
          label="Stock Value"
          value={formatCurrency(stockValue)}
          icon={<DollarSign className="size-5" />}
          color="text-success"
        />
        <MetricCard
          label="Total Profit"
          value={formatCurrency(totalProfit)}
          icon={<TrendingUp className="size-5" />}
          color="text-primary"
        />
        <StockTakeCard tenantSlug={tenantSlug} activeStockTake={activeStockTake} />
      </div>

      <ExpiringProducts tenantSlug={tenantSlug} products={expiringProducts} />
      <LowStockProducts tenantSlug={tenantSlug} products={lowStockProducts} />

      {productCount === 0 && <DashboardEmptyState tenantSlug={tenantSlug} />}
    </div>
  );
}
