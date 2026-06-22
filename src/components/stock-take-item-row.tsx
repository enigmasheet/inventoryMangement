"use client";

import { useEffect, useActionState, useRef, useState } from "react";
import { toast } from "sonner";
import { updateStockTakeItem } from "@/app/actions/stock-take";
import { Loader2 } from "lucide-react";

type Props = {
  tenantSlug: string;
  item: {
    id: string;
    product: { name: string; sku: string; unit: string };
    expectedQuantity: number;
    countedQuantity: number | null;
  };
  isActive: boolean;
};

export function StockTakeItemRow({ tenantSlug, item, isActive }: Props) {
  const [state, formAction, pending] = useActionState(
    updateStockTakeItem.bind(null, tenantSlug, item.id),
    null
  );
  const [fieldError, setFieldError] = useState("");
  const submittedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pending) submittedRef.current = true;
  }, [pending]);

  useEffect(() => {
    if (state === null && submittedRef.current) {
      toast.success("Count saved");
      submittedRef.current = false;
      setFieldError("");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const counted = data.get("countedQuantity") as string;
    if (counted === "" || counted === undefined || counted === null) {
      setFieldError("Count is required");
      return;
    }
    if (Number(counted) < 0) {
      setFieldError("Count must be 0 or more");
      return;
    }
    setFieldError("");
    formAction(data);
  };

  const counted = item.countedQuantity;
  const diff = counted !== null ? counted - item.expectedQuantity : null;

  return (
    <tr className={diff !== null && diff !== 0 && !isActive ? "bg-warning/5" : ""}>
      <td className="px-4 py-3 font-sans text-sm">{item.product.name}</td>
      <td className="px-4 py-3">
        <code className="font-mono text-xs bg-muted px-1.5 py-0.5" data-number>{item.product.sku}</code>
      </td>
      <td className="px-4 py-3 font-mono text-sm text-right" data-number>
        {item.expectedQuantity}{" "}
        <span className="font-sans text-[10px] text-muted-foreground">{item.product.unit}</span>
      </td>
      <td className="px-4 py-3 text-right">
        {isActive ? (
          <div className="inline-flex flex-col items-end gap-1">
            <form onSubmit={handleSubmit} className="inline-flex items-center gap-1">
              <input
                ref={inputRef}
                name="countedQuantity"
                type="number"
                min="0"
                defaultValue={item.countedQuantity ?? ""}
                className="w-20 h-8 bg-background border px-2 py-1 text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="—"
                data-number
              />
              <button
                type="submit"
                disabled={pending}
                className="px-2 py-1.5 text-xs font-heading font-bold uppercase tracking-wider bg-accent text-accent-foreground hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
              >
                {pending ? <Loader2 className="size-3 animate-spin" /> : "Save"}
              </button>
            </form>
            {fieldError && (
              <p className="text-xs text-destructive whitespace-nowrap">{fieldError}</p>
            )}
          </div>
        ) : (
          <span className="font-mono text-sm" data-number>{counted ?? "—"}</span>
        )}
      </td>
      <td className="px-4 py-3 font-mono text-sm text-right" data-number>
        {diff !== null ? (
          <span className={diff === 0 ? "text-success" : "text-warning"}>
            {diff > 0 ? "+" : ""}{diff}
          </span>
        ) : "—"}
      </td>
    </tr>
  );
}
