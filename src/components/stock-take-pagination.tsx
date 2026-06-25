import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string;
};

export function StockTakePagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;

  function href(page: number) {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      {currentPage > 1 && (
        <Link
          href={href(currentPage - 1)}
          className="flex items-center gap-1 px-2.5 py-1.5 border bg-card text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft className="size-3.5" />
          Prev
        </Link>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-xs font-mono text-muted-foreground">...</span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={`px-2.5 py-1.5 text-xs font-heading font-bold uppercase tracking-wider border transition-colors ${
              p === currentPage
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {p}
          </Link>
        )
      )}
      {currentPage < totalPages && (
        <Link
          href={href(currentPage + 1)}
          className="flex items-center gap-1 px-2.5 py-1.5 border bg-card text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          Next
          <ChevronRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
