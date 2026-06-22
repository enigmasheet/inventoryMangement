export default function HomeLoading() {
  return (
    <div className="flex flex-1 flex-col bg-background animate-pulse">
      <header className="border-b bg-card">
        <div className="flex h-12 items-center px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="size-7 bg-muted" />
            <div className="h-4 w-28 bg-muted" />
          </div>
          <div className="ml-auto">
            <div className="h-8 w-28 bg-muted" />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="border-b">
          <div className="flex flex-col items-center justify-center px-4 py-20 sm:py-28 text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="h-6 w-44 bg-muted mx-auto" />
              <div className="h-16 sm:h-20 w-full max-w-2xl bg-muted mx-auto" />
              <div className="h-12 w-96 bg-muted mx-auto" />
              <div className="h-12 w-48 bg-muted mx-auto" />
            </div>
          </div>
        </section>
        <section className="border-t py-16 sm:py-20 bg-card">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-10 space-y-3">
              <div className="h-6 w-48 bg-muted mx-auto" />
              <div className="h-4 w-64 bg-muted mx-auto" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border bg-background p-4">
                  <div className="flex gap-3">
                    <div className="size-9 bg-muted shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-32 bg-muted" />
                      <div className="h-4 w-full bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 bg-card">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-3 w-64 bg-muted mx-auto" />
        </div>
      </footer>
    </div>
  );
}
