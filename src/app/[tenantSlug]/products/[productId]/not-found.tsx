import Link from "next/link";
import { Package, ArrowLeft } from "lucide-react";

export default function ProductNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24">
      <div className="size-10 flex items-center justify-center bg-muted">
        <Package className="size-5 text-muted-foreground" />
      </div>
      <div className="text-center space-y-1">
        <p className="font-heading font-bold text-sm uppercase tracking-wider">Product not found</p>
        <p className="text-sm font-sans text-muted-foreground">
          This product doesn&apos;t exist or you don&apos;t have access to it.
        </p>
      </div>
      <Link
        href=".."
        className="inline-flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-wider text-primary hover:underline"
      >
        <ArrowLeft className="size-3.5" />
        Back to products
      </Link>
    </div>
  );
}
