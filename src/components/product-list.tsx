"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteProduct } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, TrendingUp } from "lucide-react";

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  unitPrice: { toString(): string };
  costPrice: { toString(): string };
  quantity: number;
  lowStockLimit: number;
  unit: string;
};

type Props = {
  tenantSlug: string;
  products: ProductRow[];
};

export function ProductList({ tenantSlug, products }: Props) {
  const router = useRouter();

  return (
    <div className="border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">Name</TableHead>
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">SKU</TableHead>
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">Sell</TableHead>
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">Cost</TableHead>
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">Margin</TableHead>
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">Qty</TableHead>
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-right font-heading font-bold text-[10px] uppercase tracking-wider"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-muted-foreground font-sans text-sm">
                No products yet. Click &quot;New Product&quot; to add one.
              </TableCell>
            </TableRow>
          )}
          {products.map((p) => {
            const isLow = p.quantity <= p.lowStockLimit;
            const isOut = p.quantity === 0;
            const price = Number(p.unitPrice);
            const cost = Number(p.costPrice);
            const profit = price - cost;
            const profitMargin = price > 0 ? ((profit / price) * 100) : 0;

            let statusLabel: string;
            let statusClasses: string;
            let dotClass: string;

            if (isOut) {
              statusLabel = "Out";
              statusClasses = "tag-flag bg-destructive/10 text-destructive border border-destructive/20";
              dotClass = "tag-dot bg-destructive";
            } else if (isLow) {
              statusLabel = "Low";
              statusClasses = "tag-flag bg-warning/10 text-warning border border-warning/20";
              dotClass = "tag-dot bg-warning";
            } else {
              statusLabel = "OK";
              statusClasses = "tag-flag bg-success/10 text-success border border-success/20";
              dotClass = "tag-dot bg-success";
            }

            return (
              <TableRow key={p.id} className="group">
                <TableCell className="font-sans text-sm font-medium">
                  <Link
                    href={`/${tenantSlug}/products/${p.id}`}
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <code className="font-mono text-xs bg-muted px-1.5 py-0.5" data-number>{p.sku}</code>
                </TableCell>
                <TableCell className="font-mono text-sm" data-number>रू{price.toFixed(2)}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground" data-number>रू{cost.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`font-mono text-xs ${profit >= 0 ? "text-success" : "text-destructive"}`} data-number>
                    {profitMargin.toFixed(0)}%
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm" data-number>
                  {p.quantity}
                  <span className="font-sans text-[10px] text-muted-foreground ml-0.5">{p.unit}</span>
                </TableCell>
                <TableCell>
                  <span className={statusClasses}>
                    <span className={dotClass} />
                    {statusLabel}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/${tenantSlug}/products/${p.id}/edit`)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (confirm("Delete this product?")) {
                          const result = await deleteProduct(p.id);
                          if (result?.error) {
                            toast.error(result.error);
                          } else {
                            toast.success("Product deleted");
                          }
                          router.refresh();
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
