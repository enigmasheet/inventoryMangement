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
import { Pencil } from "lucide-react";

const types = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
];

type Props = {
  def: { id: string; key: string; label: string; type: string };
};

export function AttributeDefEditDialog({ def }: Props) {
  const [open, setOpen] = useState(false);
  const boundAction = updateAttribute.bind(null, def.id);
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
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <Pencil className="size-3.5 text-muted-foreground hover:text-foreground" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-sm uppercase tracking-wider">Edit Field</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Key</Label>
            <Input id="key" name="key" defaultValue={def.key} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="label" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Label</Label>
            <Input id="label" name="label" defaultValue={def.label} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type" className="font-heading font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue={def.type}
              className="flex h-9 w-full bg-background border px-2.5 py-1.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
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
