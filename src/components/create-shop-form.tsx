"use client";

import { useEffect, useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createShop } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categories = [
  { value: "general", label: "General" },
  { value: "liquor", label: "Liquor Store" },
  { value: "bicycle", label: "Bicycle Shop" },
  { value: "grocery", label: "Grocery" },
  { value: "clothing", label: "Clothing" },
];

export function CreateShopForm() {
  const [state, formAction, pending] = useActionState(createShop, null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const errors: Record<string, string> = {};

    const shopName = (data.get("shopName") as string)?.trim();
    if (!shopName) errors.shopName = "Shop name is required";

    const category = data.get("category") as string;
    if (!category) errors.category = "Category is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    formAction(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {state?.error && (
        <p className="text-sm font-sans text-destructive mb-3">{state.error}</p>
      )}
      <div className="border bg-card p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shopName" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
            Shop Name <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            id="shopName"
            name="shopName"
            placeholder="e.g. The Corner Store"
            aria-invalid={!!fieldErrors.shopName}
            aria-describedby={fieldErrors.shopName ? "shopName-error" : undefined}
          />
          {fieldErrors.shopName && (
            <p id="shopName-error" className="text-xs text-destructive">{fieldErrors.shopName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
            Category <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Select name="category">
            <SelectTrigger id="category" className="w-full" aria-invalid={!!fieldErrors.category} aria-describedby={fieldErrors.category ? "category-error" : undefined}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.category && (
            <p id="category-error" className="text-xs text-destructive">{fieldErrors.category}</p>
          )}
        </div>
        <Button type="submit" disabled={pending} className="w-full gap-1.5 bg-accent text-accent-foreground hover:brightness-110 font-heading font-bold text-xs uppercase tracking-wider px-3 py-1.5">
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {pending ? "Creating..." : "Create Shop"}
        </Button>
      </div>
    </form>
  );
}
