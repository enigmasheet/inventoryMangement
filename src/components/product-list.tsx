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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Pencil, Trash2 } from "lucide-react";

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
  currency: string;
  products: ProductRow[];
  canViewCost?: boolean;
};

export function ProductList({ tenantSlug, currency, products, canViewCost = true }: Props) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto border bg-card">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">Name</TableHead>
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">SKU</TableHead>
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">Sell</TableHead>
            {canViewCost && <TableHead className="hidden sm:table-cell font-heading font-bold text-[10px] uppercase tracking-wider">Cost</TableHead>}
            {canViewCost && <TableHead className="hidden sm:table-cell font-heading font-bold text-[10px] uppercase tracking-wider">Margin</TableHead>}
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">Qty</TableHead>
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-right font-heading font-bold text-[10px] uppercase tracking-wider"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={canViewCost ? 8 : 6} className="text-center py-12 text-muted-foreground font-sans text-sm">
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

            if (isOut) {
              statusLabel = "Out";
              statusClasses = "bg-destructive/10 text-destructive";
            } else if (isLow) {
              statusLabel = "Low";
              statusClasses = "bg-warning/10 text-warning";
            } else {
              statusLabel = "OK";
              statusClasses = "bg-success/10 text-success";
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
                <TableCell className="font-mono text-sm" data-number>{currency}{price.toFixed(2)}</TableCell>
                {canViewCost && <TableCell className="hidden sm:table-cell font-mono text-sm text-muted-foreground" data-number>{currency}{cost.toFixed(2)}</TableCell>}
                {canViewCost && (
                  <TableCell className="hidden sm:table-cell">
                    <span className={`font-mono text-xs ${profit >= 0 ? "text-success" : "text-destructive"}`} data-number>
                      {profitMargin.toFixed(0)}%
                    </span>
                  </TableCell>
                )}
                <TableCell className="font-mono text-sm" data-number>
                  {p.quantity}
                  <span className="font-sans text-[10px] text-muted-foreground ml-0.5">{p.unit}</span>
                </TableCell>
                <TableCell>
                  <Badge className={`gap-1 rounded-full px-2 py-0.5 text-[11px] font-heading font-bold uppercase tracking-wider ${statusClasses}`}>
                    <span className={`size-1.5 rounded-full ${isOut ? "bg-destructive" : isLow ? "bg-warning" : "bg-success"}`} />
                    {statusLabel}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger render={<Button variant="ghost" size="sm" onClick={() => router.push(`/${tenantSlug}/products/${p.id}/edit`)} className="text-muted-foreground hover:text-foreground" aria-label={`Edit ${p.name}`} />}>
                        <Pencil className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>Edit {p.name}</TooltipContent>
                    </Tooltip>
                    <AlertDialog>
                      <AlertDialogTrigger render={
                        <Tooltip>
                          <TooltipTrigger render={<Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" />}>
                            <Trash2 className="size-3.5" />
                          </TooltipTrigger>
                          <TooltipContent>Delete {p.name}</TooltipContent>
                        </Tooltip>
                      }>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Product</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to delete {p.name}? This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={async () => {
                            const result = await deleteProduct(p.id, tenantSlug);
                            if (result?.error) {
                              toast.error(result.error);
                            } else {
                              toast.success("Product deleted");
                            }
                            router.refresh();
                          }}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
