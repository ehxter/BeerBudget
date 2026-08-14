"use client";

import { useState, useTransition } from "react";
import { RotateCw } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { refreshReferenceRates } from "./actions";

/**
 * Freshness of the numbers above, and the way to force new ones.
 *
 * "Updated 6 min ago" is exactly the thing you doubt when the figure in front
 * of you looks wrong, so it sits on the same card shelf as the source toggle
 * underneath it — the two questions you have while standing at a counter are
 * "how old is this" and "who said so", and they read as one pair.
 *
 * A failed refresh is reported in place and leaves the cached rates alone: the
 * converter keeps working on the last good numbers rather than going blank
 * because a provider is down.
 */
export function RefreshRates({ freshness }: { freshness: string }) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function handleClick() {
    setFailed(false);
    startTransition(async () => {
      const result = await refreshReferenceRates();
      setFailed(!result.ok);
    });
  }

  return (
    <Card pad={16}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-row font-medium text-ink-2">Reference rates</p>
          <p
            className={cn(
              "tnum mt-0.5 truncate text-meta",
              failed ? "text-cat-6" : "text-ink-4",
            )}
          >
            {pending
              ? "Refreshing…"
              : failed
                ? "Couldn't reach the provider"
                : freshness}
          </p>
        </div>

        <button
          type="button"
          onClick={handleClick}
          disabled={pending}
          aria-label="Refresh reference rates"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            "bg-track text-ink-3 transition-colors active:text-ink",
            pending && "opacity-70",
          )}
        >
          <RotateCw size={18} className={cn(pending && "animate-spin")} />
        </button>
      </div>
    </Card>
  );
}
