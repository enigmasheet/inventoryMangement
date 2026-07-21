import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { completeStockTakeAction, cancelStockTakeAction } from "@/app/actions/stock-take";
import { StockTakeItemRow } from "@/components/stock-take-item-row";
import { UrlErrorToast } from "@/components/url-error-toast";
import { ClipboardList, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function StockTakeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { tenantSlug, id } = await params;
  const { error } = await searchParams;
  const session = await getSession();
  if (!session?.user.tenantId) redirect("/");

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, id: session.user.tenantId },
  });
  if (!tenant) redirect("/");

  const stockTake = await prisma.stockTake.findFirst({
    where: { id, tenantId: tenant.id },
    include: {
      items: {
        include: {
          product: { select: { name: true, sku: true, unit: true } },
        },
        orderBy: { product: { name: "asc" } },
      },
    },
  });
  if (!stockTake) notFound();

  const isActive = stockTake.status === "in_progress";
  const counted = stockTake.items.filter((i) => i.countedQuantity !== null).length;
  const total = stockTake.items.length;
  const allCounted = counted === total;
  const totalDiscrepancies = stockTake.items.filter(
    (i) => i.countedQuantity !== null && i.countedQuantity !== i.expectedQuantity
  ).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <UrlErrorToast error={error} />

      <div>
        <Link
          href={`/${tenantSlug}/stock-take`}
          className="inline-flex items-center gap-1 text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="size-3.5" />
          Stock Takes
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`size-10 flex items-center justify-center ${
              isActive ? "bg-warning/10" : stockTake.status === "cancelled" ? "bg-muted" : "bg-success/10"
            }`}>
              {isActive ? (
                <ClipboardList className="size-5 text-warning" />
              ) : stockTake.status === "cancelled" ? (
                <XCircle className="size-5 text-muted-foreground" />
              ) : (
                <CheckCircle2 className="size-5 text-success" />
              )}
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg tracking-wider uppercase">
                {isActive ? "In Progress" : stockTake.status === "cancelled" ? "Cancelled" : "Completed"}
              </h1>
              <p className="text-xs font-mono text-muted-foreground" data-number>
                {new Date(stockTake.createdAt).toLocaleDateString()}
                {stockTake.completedAt && <> &middot; {new Date(stockTake.completedAt).toLocaleDateString()}</>}
                {stockTake.note && <> &middot; {stockTake.note}</>}
              </p>
            </div>
          </div>
          <div className="text-right space-y-2">
            <p className="font-mono text-sm font-semibold" data-number>{counted}/{total} counted</p>
            {totalDiscrepancies > 0 && !isActive && stockTake.status === "completed" && (
              <p className="text-xs font-mono text-warning" data-number>{totalDiscrepancies} discrepancy{totalDiscrepancies > 1 ? "ies" : "y"}</p>
            )}
            {isActive && (
              <div className="flex items-center gap-2 justify-end">
                <form action={cancelStockTakeAction.bind(null, tenantSlug, id)}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-heading font-bold uppercase tracking-wider border bg-card text-muted-foreground hover:text-destructive hover:border-destructive transition-colors cursor-pointer"
                  >
                    <XCircle className="size-3" />
                    Cancel
                  </button>
                </form>
                <form action={completeStockTakeAction.bind(null, tenantSlug, id, true)}>
                  <button
                    type="submit"
                    disabled={!allCounted}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      allCounted
                        ? "bg-accent text-accent-foreground hover:brightness-110"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <CheckCircle2 className="size-3.5" />
                    Complete{allCounted ? "" : ` (${total - counted} left)`}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border bg-card">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b">
              <th className="font-heading font-bold text-[10px] uppercase tracking-wider text-left px-4 py-2">Product</th>
              <th className="font-heading font-bold text-[10px] uppercase tracking-wider text-left px-4 py-2">SKU</th>
              <th className="font-heading font-bold text-[10px] uppercase tracking-wider text-right px-4 py-2">Expected</th>
              <th className="font-heading font-bold text-[10px] uppercase tracking-wider text-right px-4 py-2">Counted</th>
              <th className="font-heading font-bold text-[10px] uppercase tracking-wider text-right px-4 py-2">Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stockTake.items.map((item) => (
              <StockTakeItemRow
                key={item.id}
                tenantSlug={tenantSlug}
                item={item}
                isActive={isActive}
              />
            ))}
          </tbody>
        </table>
      </div>

      {!isActive && totalDiscrepancies > 0 && (
        <p className="text-xs font-sans text-muted-foreground">
          Rows highlighted in yellow had quantity differences between expected and counted values.
          {stockTake.status === "completed" && " Adjustments were applied to product quantities."}
        </p>
      )}
    </div>
  );
}
