"use client";

import { useEffect, useActionState, useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAttributeAction } from "@/app/actions/attributes";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  tenantSlug: string;
  defId: string;
  label: string;
};

export function DeleteAttributeButton({ tenantSlug, defId, label }: Props) {
  const boundAction = deleteAttributeAction.bind(null, tenantSlug, defId);
  const [state, formAction, pending] = useActionState(boundAction, null);
  const submittedRef = useRef(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pending) submittedRef.current = true;
  }, [pending]);

  useEffect(() => {
    if (state === null && submittedRef.current) {
      toast.success(`${label} deleted`);
      submittedRef.current = false;
    }
    if (state?.error) {
      toast.error(state.error);
      submittedRef.current = false;
    }
  }, [state, label]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={
        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" />}>
            <Trash2 className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent>Delete {label}</TooltipContent>
        </Tooltip>
      }>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{label}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove this field and all its values from your products. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={formAction}>
            <AlertDialogAction type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {pending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
