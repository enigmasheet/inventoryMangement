import Link from "next/link";
import { Package } from "lucide-react";

type Props = {
  tenantSlug: string;
};

export function DashboardEmptyState({ tenantSlug }: Props) {
  return (
    <div className="rounded-lg border bg-card p-14 text-center space-y-4">
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
  );
}
