export default function NewProductLoading() {
  return (
    <div className="max-w-2xl space-y-6 animate-pulse">
      <div className="h-6 w-28 bg-muted" />
      <div className="border bg-card p-4 space-y-5">
        <div className="h-3 w-24 bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-28 bg-muted" />
              <div className="h-9 w-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-4">
        <div className="h-9 w-36 bg-muted" />
        <div className="h-9 w-20 bg-muted" />
      </div>
    </div>
  );
}
