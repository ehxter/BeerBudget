"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
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
    <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-negative/20 text-negative">
        <AlertCircle size={24} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-ink">Something went wrong</h2>
        <p className="mt-1 text-sm text-ink-muted max-w-sm">
          We couldn&apos;t load this page. Check your connection and try again.
        </p>
      </div>
      <Button onClick={reset} variant="secondary">
        Try again
      </Button>
    </div>
  );
}
