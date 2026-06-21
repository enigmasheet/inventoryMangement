"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createShop } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categories = [
  { value: "general", label: "General" },
  { value: "liquor", label: "Liquor Store" },
  { value: "bicycle", label: "Bicycle Shop" },
  { value: "grocery", label: "Grocery" },
  { value: "clothing", label: "Clothing" },
];

export function CreateShopForm() {
  const [state, formAction, pending] = useActionState(createShop, null);

  return (
    <form action={formAction}>
      <div className="border bg-card p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shopName" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Shop Name</Label>
          <Input
            id="shopName"
            name="shopName"
            placeholder="e.g. The Corner Store"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Category</Label>
          <select
            id="category"
            name="category"
            className="flex h-9 w-full bg-background border px-2.5 py-1.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending} className="w-full gap-1.5 bg-accent text-accent-foreground hover:brightness-110 font-heading font-bold text-xs uppercase tracking-wider px-3 py-1.5">
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {pending ? "Creating..." : "Create Shop"}
        </Button>
      </div>
    </form>
  );
}
