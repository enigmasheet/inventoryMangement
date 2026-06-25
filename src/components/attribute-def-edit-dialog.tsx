"use client";

import { useEffect, useActionState, useRef, useState } from "react";
import { toast } from "sonner";
import { updateAttribute } from "@/app/actions/attributes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ATTRIBUTE_TYPES } from "@/lib/constants";
import { Pencil } from "lucide-react";

const types = ATTRIBUTE_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }));

type Props = {
  tenantSlug: string;
  def: { id: string; key: string; label: string; type: string };
};

export function AttributeDefEditDialog({ tenantSlug, def }: Props) {
  const [open, setOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const boundAction = updateAttribute.bind(null, tenantSlug, def.id);
  const [state, formAction, pending] = useActionState(boundAction, null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (pending) submittedRef.current = true;
  }, [pending]);

  useEffect(() => {
    if (state === null && submittedRef.current) {
      setOpen(false);
      toast.success("Field updated");
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

    const key = (data.get("key") as string)?.trim();
    if (!key) errors.key = "Key is required";

    const label = (data.get("label") as string)?.trim();
    if (!label) errors.label = "Label is required";

    const type = data.get("type") as string;
    if (!type) errors.type = "Type is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    formAction(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <Pencil className="size-3.5 text-muted-foreground hover:text-foreground" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-sm uppercase tracking-wider">Edit Field</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
              Key <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input id="key" name="key" defaultValue={def.key} />
            {fieldErrors.key && (
              <p className="text-xs text-destructive">{fieldErrors.key}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="label" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
              Label <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input id="label" name="label" defaultValue={def.label} />
            {fieldErrors.label && (
              <p className="text-xs text-destructive">{fieldErrors.label}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="type" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
              Type <span className="text-destructive ml-0.5">*</span>
            </Label>
            <select
              id="type"
              name="type"
              defaultValue={def.type}
              className="flex h-9 w-full bg-background border px-2.5 py-1.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {fieldErrors.type && (
              <p className="text-xs text-destructive">{fieldErrors.type}</p>
            )}
          </div>
          {state?.error && (
            <p className="text-sm font-sans text-destructive">{state.error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={pending} className="gap-1.5 bg-accent text-accent-foreground hover:brightness-110 font-heading font-bold text-xs uppercase tracking-wider px-3 py-1.5">
              {pending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
