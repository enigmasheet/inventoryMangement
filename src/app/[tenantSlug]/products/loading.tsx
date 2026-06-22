export default function ProductsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-28 bg-muted" />
          <div className="h-4 w-8 bg-muted" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 bg-muted" />
          <div className="h-8 w-28 bg-muted" />
        </div>
      </div>
      <div className="h-9 w-full bg-muted" />
      <div className="overflow-x-auto border bg-card">
        <div className="min-w-[600px]">
          <div className="h-10 px-4 flex items-center border-b bg-muted/30">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-1 h-3 bg-muted mx-1" />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 px-4 flex items-center border-b last:border-b-0">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="flex-1 h-3 bg-muted mx-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-8 bg-muted" />
        ))}
      </div>
    </div>
  );
}
