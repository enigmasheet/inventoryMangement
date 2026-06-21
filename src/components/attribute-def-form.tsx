"use client";

import { useEffect, useActionState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createAttribute } from "@/app/actions/attributes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ATTRIBUTE_TYPES } from "@/lib/constants";

const types = ATTRIBUTE_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }));

export function AttributeDefForm() {
  const [state, formAction, pending] = useActionState(createAttribute, null);
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (pending) submittedRef.current = true;
  }, [pending]);

  useEffect(() => {
    if (state === null && submittedRef.current && formRef.current) {
      toast.success("Field added");
      formRef.current.reset();
      submittedRef.current = false;
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="key" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Key</Label>
          <Input id="key" name="key" placeholder="e.g. expiryDate" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="label" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Label</Label>
          <Input id="label" name="label" placeholder="e.g. Expiry Date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Type</Label>
          <select
            id="type"
            name="type"
            className="flex h-9 w-full bg-background border px-2.5 py-1.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            {types.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      {state?.error && (
        <p className="text-sm font-sans text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="gap-1.5 bg-accent text-accent-foreground hover:brightness-110 font-heading font-bold text-xs uppercase tracking-wider px-3 py-1.5">
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {pending ? "Adding..." : "Add Field"}
      </Button>
    </form>
  );
}
