"use client";

import { useEffect, useActionState, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { recordMovement } from "@/app/actions/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  tenantSlug: string;
  productId: string;
};

export function StockMovementForm({ tenantSlug, productId }: Props) {
  const boundAction = recordMovement.bind(null, tenantSlug, productId);
  const [state, formAction, pending] = useActionState(boundAction, null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (pending) submittedRef.current = true;
  }, [pending]);

  useEffect(() => {
    if (state === null && submittedRef.current && formRef.current) {
      toast.success("Movement recorded");
      formRef.current.reset();
      submittedRef.current = false;
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const errors: Record<string, string> = {};

    const type = data.get("type") as string;
    if (!type) errors.type = "Type is required";

    const quantity = data.get("quantity") as string;
    if (!quantity || Number(quantity) < 1) errors.quantity = "Quantity must be at least 1";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    formAction(data);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="border bg-card p-4 space-y-5">
      <h3 className="font-heading font-bold text-xs uppercase tracking-wider">Record Stock Movement</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="type" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
            Type <span className="text-destructive ml-0.5">*</span>
          </Label>
          <select
            id="type"
            name="type"
            className="flex h-9 w-full bg-background border px-2.5 py-1.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select type</option>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
          </select>
          {fieldErrors.type && (
            <p className="text-xs text-destructive">{fieldErrors.type}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
            Quantity <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Input id="quantity" name="quantity" type="number" min="1" />
          {fieldErrors.quantity && (
            <p className="text-xs text-destructive">{fieldErrors.quantity}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="note" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Note</Label>
          <Input id="note" name="note" placeholder="e.g. supplier delivery" />
        </div>
      </div>
      {state?.error && (
        <p className="text-sm font-sans text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="gap-1.5 bg-accent text-accent-foreground hover:brightness-110 font-heading font-bold text-xs uppercase tracking-wider px-3 py-1.5">
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {pending ? "Recording..." : "Record"}
      </Button>
    </form>
  );
}
