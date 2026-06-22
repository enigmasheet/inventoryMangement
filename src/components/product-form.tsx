"use client";

import { useEffect, useActionState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AttributeDefinition, Product, ProductAttributeValue } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRODUCT_UNITS } from "@/lib/constants";

type SerializedProduct = Omit<Product, "unitPrice" | "costPrice"> & {
  unitPrice: number;
  costPrice: number;
  attributes?: (ProductAttributeValue & { attributeDef: Pick<AttributeDefinition, "id"> })[];
};

type Props = {
  tenantSlug: string;
  currency: string;
  attributeDefs: Pick<AttributeDefinition, "id" | "key" | "label" | "type">[];
  product?: SerializedProduct;
  action: (
    prevState: { error?: string } | null,
    formData: FormData
  ) => Promise<{ error?: string } | null>;
};

export function ProductForm({ tenantSlug, currency, attributeDefs, product, action }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (pending) submittedRef.current = true;
  }, [pending]);

  useEffect(() => {
    if (state === null && submittedRef.current) {
      toast.success(product ? "Product updated" : "Product created");
      submittedRef.current = false;
    }
  }, [state, product]);

  const getAttrValue = (defId: string) =>
    product?.attributes?.find((a) => a.attributeDefId === defId)?.value ?? "";

  return (
    <form action={formAction} className="space-y-6">
      <div className="border bg-card p-4 space-y-5">
        <h3 className="font-heading font-bold text-xs uppercase tracking-wider">Basic Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Product Name</Label>
            <Input id="name" name="name" defaultValue={product?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">SKU</Label>
            <Input id="sku" name="sku" defaultValue={product?.sku} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitPrice" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Selling Price ({currency})</Label>
            <Input
              id="unitPrice"
              name="unitPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.unitPrice.toString() ?? "0"}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="costPrice" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Cost Price ({currency})</Label>
            <Input
              id="costPrice"
              name="costPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.costPrice.toString() ?? "0"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              defaultValue={product?.quantity.toString() ?? "0"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lowStockLimit" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Low Stock Limit</Label>
            <Input
              id="lowStockLimit"
              name="lowStockLimit"
              type="number"
              min="0"
              defaultValue={product?.lowStockLimit.toString() ?? "5"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Unit</Label>
            <select
              id="unit"
              name="unit"
              defaultValue={product?.unit ?? "pcs"}
              className="flex h-9 w-full bg-background border px-2.5 py-1.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PRODUCT_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {attributeDefs.length > 0 && (
        <div className="border bg-card p-4 space-y-5">
          <h3 className="font-heading font-bold text-xs uppercase tracking-wider">Custom Attributes</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {attributeDefs.map((def) => (
              <div key={def.id} className="space-y-2">
                <Label htmlFor={`attr_${def.id}`} className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">{def.label}</Label>
                {def.type === "date" ? (
                  <input
                    id={`attr_${def.id}`}
                    name={`attr_${def.id}`}
                    type="date"
                    defaultValue={getAttrValue(def.id)}
                    className="flex h-9 w-full bg-background border px-2.5 py-1.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <Input
                    id={`attr_${def.id}`}
                    name={`attr_${def.id}`}
                    type={def.type}
                    defaultValue={getAttrValue(def.id)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {state?.error && (
        <p className="text-sm font-sans text-destructive">{state.error}</p>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={pending} className="gap-1.5 bg-accent text-accent-foreground hover:brightness-110 font-heading font-bold text-xs uppercase tracking-wider px-3 py-1.5">
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {pending ? "Saving..." : product ? "Update Product" : "Create Product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(`/${tenantSlug}/products`)} className="font-heading font-bold text-xs uppercase tracking-wider">
          Cancel
        </Button>
      </div>
    </form>
  );
}
