export default function StockTakeLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 w-36 bg-muted" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border bg-card px-4 py-3 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-44 bg-muted" />
            <div className="h-3 w-28 bg-muted" />
          </div>
          <div className="h-3 w-20 bg-muted" />
        </div>
      ))}
    </div>
  );
}
