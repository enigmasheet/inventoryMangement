import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Package, ArrowLeft, Edit3, Hash, Tag, DollarSign, Layers, Archive, TrendingUp, TrendingDown, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StockMovementForm } from "@/components/stock-movement-form";
import { StockMovementList } from "@/components/stock-movement-list";

async function MovementSection({ tenantId, productId }: { tenantId: string; productId: string }) {
  const movements = await prisma.stockMovement.findMany({
    where: { tenantId, productId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return <StockMovementList movements={movements} />;
}

function MovementSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 bg-muted rounded animate-pulse" />
      ))}
    </div>
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; productId: string }>;
}) {
  const { tenantSlug, productId } = await params;
  const session = await getSession();
  if (!session?.user.tenantId) redirect("/");

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, id: session.user.tenantId },
  });
  if (!tenant) redirect("/");

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: tenant.id },
    include: {
      attributes: {
        include: { attributeDef: { select: { label: true, type: true } } },
      },
    },
  });
  if (!product) notFound();

  const expiryAttr = product.attributes.find(
    (a) => a.attributeDef.type === "date" && a.value && /^\d{4}-\d{2}-\d{2}$/.test(a.value)
  );
  const expiryDate = expiryAttr ? new Date(expiryAttr.value) : null;
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const isExpiringSoon =
    expiryDate &&
    expiryDate >= now &&
    expiryDate <= thirtyDaysFromNow;

  const isLow = product.quantity <= product.lowStockLimit;
  const isOut = product.quantity === 0;
  const price = Number(product.unitPrice);
  const cost = Number(product.costPrice);
  const profit = price - cost;
  const profitMargin = price > 0 ? ((profit / price) * 100) : 0;

  let statusLabel: string;
  let statusClasses: string;
  if (isOut) {
    statusLabel = "Out of Stock";
    statusClasses = "bg-destructive/10 text-destructive";
  } else if (isLow) {
    statusLabel = "Low Stock";
    statusClasses = "bg-warning/10 text-warning";
  } else {
    statusLabel = "In Stock";
    statusClasses = "bg-success/10 text-success";
  }

  const canViewCost = tenant.showFinancials || session.user.id === tenant.createdById;

  const infoItems = [
    { icon: Hash, label: "SKU", value: product.sku, mono: true },
    { icon: DollarSign, label: "Selling Price", value: `${tenant.currency}${price.toFixed(2)}`, mono: true },
    ...(canViewCost
      ? [
          { icon: TrendingDown, label: "Cost Price", value: `${tenant.currency}${cost.toFixed(2)}`, mono: true } as const,
          { icon: TrendingUp, label: "Profit Margin", value: `${profitMargin.toFixed(1)}%`, mono: true, valueClass: profit >= 0 ? "text-success" : "text-destructive" } as const,
        ]
      : []),
    { icon: Layers, label: "Quantity", value: `${product.quantity} ${product.unit}`, mono: true },
    { icon: Archive, label: "Low Stock Limit", value: product.lowStockLimit.toString(), mono: true },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <Link
          href={`/${tenantSlug}/products`}
          className="inline-flex items-center gap-1 text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="size-3.5" />
          Products
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-10 flex items-center justify-center bg-primary/10">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl tracking-wider uppercase">{product.name}</h1>
              <Badge className={`gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-heading font-bold uppercase tracking-wider ${statusClasses}`}>
                <span className={`size-2 rounded-full ${isOut ? "bg-destructive" : isLow ? "bg-warning" : "bg-success"}`} />
                {statusLabel}
              </Badge>
            </div>
          </div>
          <Link
            href={`/${tenantSlug}/products/${productId}/edit`}
            className="inline-flex items-center gap-1.5 border bg-card px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider hover:bg-muted transition-colors shrink-0"
          >
            <Edit3 className="size-3.5" />
            Edit
          </Link>
        </div>
      </div>

      {isExpiringSoon && (
        <div className="flex items-center gap-2 border border-accent bg-accent/10 rounded-lg px-4 py-3 text-sm font-sans">
          <CalendarClock className="size-4 text-accent shrink-0" />
          <span>
            <strong className="font-heading font-bold text-xs uppercase tracking-wider text-accent">Expiring soon</strong>
            <span className="text-muted-foreground ml-2">
              {expiryAttr?.attributeDef.label}: {expiryDate?.toLocaleDateString()}
            </span>
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {infoItems.map((item) => (
          <div key={item.label} className="border bg-card p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-heading font-bold uppercase tracking-wider text-muted-foreground">
              <item.icon className="size-3.5" />
              {item.label}
            </div>
            <p className={`font-mono text-base font-semibold ${item.valueClass ?? ""}`} data-number>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {product.attributes.length > 0 && (
        <div className="border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="size-3.5 text-primary" />
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider">Custom Attributes</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {product.attributes.map((a) => (
              <div key={a.id} className="flex items-center gap-2 bg-muted px-3 py-2 text-sm font-sans">
                <span className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">{a.attributeDef.label}:</span>
                <span>{a.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <StockMovementForm tenantSlug={tenantSlug} productId={productId} />

      <div className="space-y-4">
        <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-muted-foreground">Movement History</h2>
        <Suspense fallback={<MovementSkeleton />}>
          <MovementSection tenantId={tenant.id} productId={productId} />
        </Suspense>
      </div>
    </div>
  );
}
