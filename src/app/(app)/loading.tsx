export default function Loading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div
        role="status"
        aria-label="Loading"
        className="size-6 animate-spin rounded-full border-2 border-track border-t-ink"
      />
    </div>
  );
}
