export default function JoinShopLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-4 bg-background animate-pulse">
      <div className="w-full max-w-md space-y-6">
        <div className="h-3 w-12 bg-muted" />
        <div className="text-center space-y-3">
          <div className="size-10 bg-muted mx-auto" />
          <div className="space-y-2">
            <div className="h-6 w-36 bg-muted mx-auto" />
            <div className="h-4 w-56 bg-muted mx-auto" />
          </div>
        </div>
        <div className="border bg-card p-4 space-y-4">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-muted" />
            <div className="h-9 w-full bg-muted" />
          </div>
          <div className="h-9 w-full bg-muted" />
        </div>
        <div className="h-3 w-52 bg-muted mx-auto" />
      </div>
    </div>
  );
}
