"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 px-8 text-center">
      <div>
        <h2 className="text-row font-medium text-ink">Something went wrong</h2>
        <p className="mt-1.5 text-meta leading-relaxed text-ink-4">
          We couldn&apos;t load this screen. Check your connection and try again.
        </p>
      </div>
      <Button onClick={reset} variant="quiet">
        Try again
      </Button>
    </div>
  );
}
