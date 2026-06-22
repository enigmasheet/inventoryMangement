import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { startStockTakeAction } from "@/app/actions/stock-take";
import { StockTakeListError } from "@/components/stock-take-list-error";
import { ClipboardList, CheckCircle2, Clock, XCircle, Plus } from "lucide-react";
import Link from "next/link";

export default async function StockTakeListPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { tenantSlug } = await params;
  const { error } = await searchParams;
  const session = await getSession();
  if (!session?.user.tenantId) redirect("/");

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, id: session.user.tenantId },
  });
  if (!tenant) redirect("/");

  const stockTakes = await prisma.stockTake.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { id: true, countedQuantity: true, expectedQuantity: true } },
    },
  });

  const hasActiveStockTake = stockTakes.some((st) => st.status === "in_progress");

  return (
    <div className="space-y-6">
      <StockTakeListError error={error} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-heading font-bold text-lg tracking-wider uppercase">
            Stock Takes
          </h1>
          <span className="text-[11px] font-mono text-muted-foreground" data-number>
            {stockTakes.length}
          </span>
        </div>
        {!hasActiveStockTake && (
          <form action={startStockTakeAction.bind(null, tenantSlug)}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer"
            >
              <Plus className="size-3.5" />
              Start New
            </button>
          </form>
        )}
      </div>

      {stockTakes.map((st) => {
        const counted = st.items.filter((i) => i.countedQuantity !== null).length;
        const total = st.items.length;
        const discrepancies = st.items.filter(
          (i) => i.countedQuantity !== null && i.countedQuantity !== i.expectedQuantity
        ).length;

        return (
          <Link
            key={st.id}
            href={`/${tenantSlug}/stock-take/${st.id}`}
            className={`flex items-center justify-between border px-4 py-3 hover:bg-muted transition-colors ${
              st.status === "in_progress" ? "border-warning bg-warning/5" : "bg-card"
            }`}
          >
            <div className="flex items-center gap-3">
              {st.status === "in_progress" ? (
                <Clock className="size-5 text-warning" />
              ) : st.status === "cancelled" ? (
                <XCircle className="size-5 text-muted-foreground" />
              ) : (
                <CheckCircle2 className="size-5 text-success" />
              )}
              <div>
                <p className="font-sans text-sm font-medium">
                  {st.status === "in_progress" ? "In Progress" : st.status === "cancelled" ? "Cancelled" : "Completed"}
                  {st.note && <span className="text-muted-foreground ml-1">— {st.note}</span>}
                </p>
                <p className="text-xs font-mono text-muted-foreground" data-number>
                  {new Date(st.createdAt).toLocaleDateString()}
                  {st.completedAt && <> &middot; {st.status === "cancelled" ? "cancelled" : "completed"} {new Date(st.completedAt).toLocaleDateString()}</>}
                </p>
              </div>
            </div>
            <div className="text-right text-xs font-mono text-muted-foreground" data-number>
              <p>{counted}/{total} counted</p>
              {discrepancies > 0 && st.status === "completed" && (
                <p className="text-warning">{discrepancies} discrepancy{discrepancies > 1 ? "ies" : "y"}</p>
              )}
            </div>
          </Link>
        );
      })}

      {stockTakes.length === 0 && (
        <div className="rounded-lg border bg-card p-12 text-center space-y-4">
          <ClipboardList className="size-10 mx-auto text-muted-foreground/50" />
          <div className="space-y-1">
            <p className="font-sans font-semibold">No stock takes yet</p>
            <p className="text-sm font-sans text-muted-foreground">
              Start a stock take to count your inventory and spot discrepancies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
