export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 w-32 bg-muted" />
      <div className="border bg-card p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-muted" />
              <div className="h-3 w-20 bg-muted" />
            </div>
            <div className="h-3 w-16 bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
