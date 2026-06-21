import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, AlertTriangle, DollarSign, TrendingUp, ArrowUpRight, TrendingDown } from "lucide-react";

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

  const productCount = await prisma.product.count({
    where: { tenantId: tenant.id },
  });

  const lowStockResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*)::bigint as count FROM "Product"
    WHERE "tenantId" = ${tenant.id} AND "quantity" <= "lowStockLimit"
  `;
  const lowStockCount = Number(lowStockResult[0].count);

  const stockValueResult = await prisma.$queryRaw<[{ total: string | null }]>`
    SELECT SUM(quantity * "unitPrice")::numeric(65,2) as total FROM "Product"
    WHERE "tenantId" = ${tenant.id}
  `;
  const stockValue = stockValueResult[0].total;

  const profitResult = await prisma.$queryRaw<[{ total: string | null }]>`
    SELECT SUM(quantity * ("unitPrice" - "costPrice"))::numeric(65,2) as total FROM "Product"
    WHERE "tenantId" = ${tenant.id}
  `;
  const totalProfit = profitResult[0].total;

  const lowStockProducts = await prisma.$queryRaw<
    { id: string; name: string; sku: string; quantity: number; lowStockLimit: number; unit: string }[]
  >`
    SELECT id, name, sku, quantity, "lowStockLimit", unit FROM "Product"
    WHERE "tenantId" = ${tenant.id} AND "quantity" <= "lowStockLimit"
    ORDER BY quantity ASC
    LIMIT 10
  `;

  const cards = [
    {
      label: "Total Products",
      value: productCount,
      icon: Package,
      color: "text-primary border-primary",
      accent: "bg-primary/10",
    },
    {
      label: "Low Stock Items",
      value: lowStockCount,
      icon: AlertTriangle,
      color: "text-warning border-warning",
      accent: "bg-warning/10",
    },
    {
      label: "Stock Value",
      value: `रू${Number(stockValue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-success border-success",
      accent: "bg-success/10",
    },
    {
      label: "Total Profit",
      value: `रू${Number(totalProfit ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-primary border-primary",
      accent: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="font-heading font-bold text-lg tracking-wider uppercase">
          Dashboard
        </h1>
        <span className="text-[11px] font-sans text-muted-foreground">
          {session.user.name}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="border border-dashed bg-card p-5 hover:shadow-sm transition-shadow"
          >
            <p className="font-heading font-bold text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              {card.label}
            </p>
            <div className="flex items-end justify-between">
              <p className="font-mono text-2xl font-semibold tracking-tight" data-number>
                {card.value}
              </p>
              <card.icon className="size-5 text-muted-foreground/50" />
            </div>
          </div>
        ))}
      </div>

      {lowStockProducts.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-warning flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Low Stock Products
          </h2>
          <div className="border divide-y bg-card">
            {lowStockProducts.map((p) => (
              <Link
                key={p.id}
                href={`/${tenantSlug}/products/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors group/link"
              >
                <div>
                  <p className="font-sans text-sm font-medium group-hover/link:text-primary transition-colors">{p.name}</p>
                  <p className="text-xs font-mono text-muted-foreground" data-number>{p.sku}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold text-warning" data-number>{p.quantity} <span className="font-sans text-xs font-normal">{p.unit}</span></p>
                    <p className="text-[10px] font-sans text-muted-foreground">limit {p.lowStockLimit}</p>
                  </div>
                  <ArrowUpRight className="size-3.5 text-muted-foreground/50 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {productCount === 0 && (
        <div className="border border-dashed p-14 text-center space-y-4 bg-card">
          <Package className="size-10 mx-auto text-muted-foreground/50" />
          <div className="space-y-1">
            <p className="font-sans font-semibold">No products yet</p>
            <p className="text-sm font-sans text-muted-foreground">
              Add your first product to start tracking inventory.
            </p>
          </div>
          <Link
            href={`/${tenantSlug}/products/new`}
            className="inline-flex items-center justify-center bg-accent text-accent-foreground px-4 py-2 text-sm font-heading font-bold uppercase tracking-wider hover:brightness-110 transition-all"
          >
            Add Product
          </Link>
        </div>
      )}
    </div>
  );
}
