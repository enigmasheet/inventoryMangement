import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default async function TenantNotFound({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams?.tenantSlug;

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24">
      <div className="size-10 flex items-center justify-center bg-warning/10">
        <FileQuestion className="size-5 text-warning" />
      </div>
      <div className="text-center space-y-1">
        <p className="font-heading font-bold text-sm uppercase tracking-wider">Page not found</p>
        <p className="text-sm font-sans text-muted-foreground">
          This page doesn&apos;t exist in your shop.
        </p>
      </div>
      {tenantSlug && (
        <Link
          href={`/${tenantSlug}/dashboard`}
          className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider hover:brightness-110 transition-all"
        >
          Back to Dashboard
        </Link>
      )}
    </div>
  );
}
