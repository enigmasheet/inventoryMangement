import Link from "next/link";
import { CalendarClock, ArrowUpRight } from "lucide-react";

type ExpiringProduct = { id: string; name: string; sku: string; expiryDate: Date };

type Props = {
  tenantSlug: string;
  products: ExpiringProduct[];
};

export function ExpiringProducts({ tenantSlug, products }: Props) {
  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-accent flex items-center gap-2">
        <CalendarClock className="size-4" />
        Expiring Soon
      </h2>
      <div className="border divide-y bg-card">
        {products.map((p) => (
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
              <p className="font-mono text-sm font-semibold text-accent" data-number>
                {new Date(p.expiryDate).toLocaleDateString()}
              </p>
              <ArrowUpRight className="size-3.5 text-muted-foreground/50 opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
