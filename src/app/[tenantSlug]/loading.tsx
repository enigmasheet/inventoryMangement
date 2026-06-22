export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-5 w-36 bg-muted" />
        <div className="h-4 w-24 bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border bg-card p-5 space-y-3">
            <div className="h-3 w-24 bg-muted" />
            <div className="h-7 w-20 bg-muted" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-4 w-40 bg-muted" />
        <div className="border bg-card">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 px-4 flex items-center border-b last:border-b-0">
              <div className="h-3 w-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-4 w-36 bg-muted" />
        <div className="border bg-card">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 px-4 flex items-center border-b last:border-b-0">
              <div className="h-3 w-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
