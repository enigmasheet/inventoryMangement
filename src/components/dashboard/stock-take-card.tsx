import Link from "next/link";
import { ClipboardList } from "lucide-react";

type StockTake = { id: string; createdAt: Date };

type Props = {
  tenantSlug: string;
  activeStockTake: StockTake | null;
};

export function StockTakeCard({ tenantSlug, activeStockTake }: Props) {
  if (activeStockTake) {
    return (
      <Link
        href={`/${tenantSlug}/stock-take/${activeStockTake.id}`}
        className="rounded-lg border-2 border-warning bg-warning/5 p-5 hover:shadow-sm transition-shadow"
      >
        <p className="font-heading font-bold text-[11px] uppercase tracking-wider text-warning mb-2 flex items-center gap-1.5">
          <ClipboardList className="size-3.5" />
          Active Stock Take
        </p>
        <p className="font-mono text-xs" data-number>
          Started {new Date(activeStockTake.createdAt).toLocaleDateString()}
        </p>
      </Link>
    );
  }

  return (
    <Link
      href={`/${tenantSlug}/stock-take`}
      className="rounded-lg border bg-card p-5 hover:shadow-sm transition-shadow"
    >
      <p className="font-heading font-bold text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
        <ClipboardList className="size-3.5" />
        New Stock Take
      </p>
      <p className="font-mono text-xs text-muted-foreground" data-number>
        Start counting inventory
      </p>
    </Link>
  );
}
