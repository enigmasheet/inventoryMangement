"use client";

import { useOptimistic, startTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { toggleFinancials } from "@/app/actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Props = { initialValue: boolean };

export function ToggleFinancials({ initialValue }: Props) {
  const [optimisticValue, setOptimisticValue] = useOptimistic(initialValue);

  const checked = optimisticValue;

  const handleToggle = async () => {
    const next = !checked;
    startTransition(async () => {
      setOptimisticValue(next);
      const result = await toggleFinancials(next);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
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
        <Label>
          <span className="sr-only">Toggle financial fields visibility</span>
          <Switch checked={checked} onCheckedChange={handleToggle} />
        </Label>
      </div>
    </div>
  );
}
