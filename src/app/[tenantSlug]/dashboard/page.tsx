import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Package, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { StockTakeCard } from "@/components/dashboard/stock-take-card";
import { ExpiringProducts } from "@/components/dashboard/expiring-products";
import { LowStockProducts } from "@/components/dashboard/low-stock-products";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";

async function MetricsGrid({ tenantId, tenantSlug, currency, canViewCost }: { tenantId: string; tenantSlug: string; currency: string; canViewCost: boolean }) {
  const [productCount, lowStockResult, stockValueResult, profitResult] =
    await Promise.all([
      prisma.product.count({ where: { tenantId } }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count FROM "Product"
        WHERE "tenantId" = ${tenantId} AND "quantity" <= "lowStockLimit"
      `,
      prisma.$queryRaw<[{ total: string | null }]>`
        SELECT SUM(quantity * "unitPrice")::numeric(65,2) as total FROM "Product"
        WHERE "tenantId" = ${tenantId}
      `,
      prisma.$queryRaw<[{ total: string | null }]>`
        SELECT SUM(quantity * ("unitPrice" - "costPrice"))::numeric(65,2) as total FROM "Product"
        WHERE "tenantId" = ${tenantId}
      `,
    ]);

  const lowStockCount = Number(lowStockResult[0].count);
  const stockValue = stockValueResult[0].total;
  const totalProfit = profitResult[0].total;

  const fmt = (v: string | null) =>
    `${currency}${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <MetricCard label="Total Products" value={productCount} icon={<Package className="size-5" />} color="text-primary" />
      <MetricCard label="Low Stock Items" value={lowStockCount} icon={<AlertTriangle className="size-5" />} color="text-warning" />
      <MetricCard label="Stock Value" value={fmt(stockValue)} icon={<DollarSign className="size-5" />} color="text-success" />
      {canViewCost && (
        <MetricCard label="Total Profit" value={fmt(totalProfit)} icon={<TrendingUp className="size-5" />} color="text-primary" />
      )}
      {productCount === 0 && <DashboardEmptyState tenantSlug={tenantSlug} />}
    </>
  );
}

function MetricSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-5 animate-pulse">
          <div className="h-3 w-24 bg-muted rounded mb-3" />
          <div className="h-7 w-20 bg-muted rounded" />
        </div>
      ))}
    </>
  );
}

async function StockTakeSection({ tenantId, tenantSlug }: { tenantId: string; tenantSlug: string }) {
  const activeStockTake = await prisma.stockTake.findFirst({
    where: { tenantId, status: "in_progress" },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });
  return <StockTakeCard tenantSlug={tenantSlug} activeStockTake={activeStockTake} />;
}

function StockTakeSkeleton() {
  return <div className="rounded-lg border bg-card p-5 animate-pulse"><div className="h-3 w-32 bg-muted rounded mb-3" /><div className="h-4 w-24 bg-muted rounded" /></div>;
}

async function ExpiringSection({ tenantId, tenantSlug }: { tenantId: string; tenantSlug: string }) {
  const products = await prisma.$queryRaw<
    { id: string; name: string; sku: string; expiryDate: Date }[]
  >`
    SELECT p.id, p.name, p.sku, pav.value::date as "expiryDate"
    FROM "ProductAttributeValue" pav
    JOIN "AttributeDefinition" ad ON ad.id = pav."attributeDefId"
    JOIN "Product" p ON p.id = pav."productId"
    WHERE p."tenantId" = ${tenantId}
      AND ad.type = 'date'
      AND pav.value IS NOT NULL
      AND pav.value ~ '^\d{4}-\d{2}-\d{2}$'
      AND pav.value::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    ORDER BY pav.value::date ASC
    LIMIT 10
  `;
  return <ExpiringProducts tenantSlug={tenantSlug} products={products} />;
}

function ListSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5 animate-pulse space-y-3">
      <div className="h-3 w-32 bg-muted rounded" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-4 w-full bg-muted rounded" />
      ))}
    </div>
  );
}

async function LowStockSection({ tenantId, tenantSlug }: { tenantId: string; tenantSlug: string }) {
  const products = await prisma.$queryRaw<
    { id: string; name: string; sku: string; quantity: number; lowStockLimit: number; unit: string }[]
  >`
    SELECT id, name, sku, quantity, "lowStockLimit", unit FROM "Product"
    WHERE "tenantId" = ${tenantId} AND "quantity" <= "lowStockLimit"
    ORDER BY quantity ASC LIMIT 10
  `;
  return <LowStockProducts tenantSlug={tenantSlug} products={products} />;
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await getSession();

  if (!session?.user.tenantId) {
    redirect("/");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, showFinancials: true, createdById: true, currency: true },
  });
  if (!tenant || tenant.id !== session.user.tenantId) {
    redirect("/");
  }

  const canViewCost = tenant.showFinancials || session.user.id === tenant.createdById;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="font-heading font-bold text-lg tracking-wider uppercase">Dashboard</h1>
        <span className="text-[11px] font-sans text-muted-foreground">{session.user.name}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<MetricSkeleton />}>
          <MetricsGrid tenantId={tenant.id} tenantSlug={tenantSlug} currency={tenant.currency} canViewCost={canViewCost} />
        </Suspense>
        <Suspense fallback={<StockTakeSkeleton />}>
          <StockTakeSection tenantId={tenant.id} tenantSlug={tenantSlug} />
        </Suspense>
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <ExpiringSection tenantId={tenant.id} tenantSlug={tenantSlug} />
      </Suspense>

      <Suspense fallback={<ListSkeleton />}>
        <LowStockSection tenantId={tenant.id} tenantSlug={tenantSlug} />
      </Suspense>
    </div>
  );
}
