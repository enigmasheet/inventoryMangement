export default function StockTakeDetailLoading() {
  return (
    <div className="space-y-6 max-w-4xl animate-pulse">
      <div className="h-4 w-24 bg-muted" />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-muted" />
            <div className="h-3 w-52 bg-muted" />
          </div>
        </div>
        <div className="space-y-2 text-right">
          <div className="h-4 w-20 bg-muted ml-auto" />
          <div className="h-7 w-24 bg-muted ml-auto" />
        </div>
      </div>
      <div className="border bg-card">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 px-4 flex items-center border-b last:border-b-0">
            <div className="h-3 w-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
