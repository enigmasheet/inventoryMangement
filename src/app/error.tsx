"use client";

export default function RootError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void _error;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-24 bg-background">
      <div className="text-center space-y-2">
        <h1 className="font-heading text-2xl font-bold tracking-wider uppercase">Something went wrong</h1>
        <p className="text-sm font-sans text-muted-foreground">Please try again or refresh the page.</p>
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 text-xs font-heading font-bold uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}
