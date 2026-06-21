import Link from "next/link";
import { AlertTriangle, ArrowUpRight } from "lucide-react";

type LowStockProduct = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  lowStockLimit: number;
  unit: string;
};

type Props = {
  tenantSlug: string;
  products: LowStockProduct[];
};

export function LowStockProducts({ tenantSlug, products }: Props) {
  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-warning flex items-center gap-2">
        <AlertTriangle className="size-4" />
        Low Stock Products
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
  );
}
