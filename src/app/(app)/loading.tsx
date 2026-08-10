export default function Loading() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-3 border-t-brand" />
      <p className="text-sm font-medium text-ink-muted">Loading...</p>
    </div>
  );
}
