"use client";

import { useActionState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { toggleFinancials } from "@/app/actions";

type Props = { initialValue: boolean };

export function ToggleFinancials({ initialValue }: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const val = formData.get("showFinancials") === "on";
      const result = await toggleFinancials(val);
      if (result?.error) toast.error(result.error);
      return result;
    },
    null
  );

  const checked = state?.showFinancials ?? initialValue;

  return (
    <form action={formAction} className="border bg-card p-4 space-y-3">
      <label className="flex items-center justify-between cursor-pointer">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            {checked ? <Eye className="size-4 text-primary" /> : <EyeOff className="size-4 text-muted-foreground" />}
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider">Financial Fields</h3>
          </div>
          <p className="text-xs font-sans text-muted-foreground">
            {checked
              ? "All members can see cost price and margin"
              : "Only the owner can see cost price and margin"}
          </p>
        </div>
        <button
          type="submit"
          name="showFinancials"
          value={checked ? "off" : "on"}
          disabled={pending}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-accent" : "bg-muted"}`}
        >
          <span
            className={`inline-block size-5 rounded-full bg-background shadow-sm border transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
          />
        </button>
      </label>
    </form>
  );
}
