"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ProductDetailError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24">
      <div className="size-10 flex items-center justify-center bg-destructive/10">
        <AlertTriangle className="size-5 text-destructive" />
      </div>
      <div className="text-center space-y-1">
        <p className="font-heading font-bold text-sm uppercase tracking-wider">Failed to load product</p>
        <p className="text-sm font-sans text-muted-foreground max-w-sm">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer"
      >
        <RefreshCw className="size-3.5" />
        Try again
      </button>
    </div>
  );
}
