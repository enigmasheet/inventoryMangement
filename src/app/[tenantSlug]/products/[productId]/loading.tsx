export default function ProductDetailLoading() {
  return (
    <div className="space-y-8 max-w-4xl animate-pulse">
      <div className="space-y-3">
        <div className="h-3 w-20 bg-muted" />
        <div className="flex items-start gap-4">
          <div className="size-10 bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted" />
            <div className="h-4 w-24 bg-muted" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border bg-card p-4 space-y-2">
            <div className="h-3 w-16 bg-muted" />
            <div className="h-5 w-20 bg-muted" />
          </div>
        ))}
      </div>
      <div className="border bg-card p-4 space-y-4">
        <div className="h-4 w-36 bg-muted" />
        <div className="h-9 w-full bg-muted" />
        <div className="h-9 w-20 bg-muted" />
      </div>
    </div>
  );
}
