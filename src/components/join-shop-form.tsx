"use client";

import { useEffect, useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { joinShopByCode } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JoinShopForm() {
  const [state, formAction, pending] = useActionState(joinShopByCode, null);
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

    const code = (data.get("code") as string)?.trim();
    if (!code) errors.code = "Invite code is required";

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
          <Label htmlFor="code" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
            Invite Code <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            id="code"
            name="code"
            placeholder="e.g. A7K2X9M4PQ"
            maxLength={10}
            className="font-mono uppercase tracking-widest"
            aria-invalid={!!fieldErrors.code}
            aria-describedby={fieldErrors.code ? "code-error" : undefined}
          />
          {fieldErrors.code && (
            <p id="code-error" className="text-xs text-destructive">{fieldErrors.code}</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={pending}
          className="w-full gap-1.5 bg-accent text-accent-foreground hover:brightness-110 font-heading font-bold text-xs uppercase tracking-wider px-3 py-1.5"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {pending ? "Joining..." : "Join Shop"}
        </Button>
      </div>
    </form>
  );
}
