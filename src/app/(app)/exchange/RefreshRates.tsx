"use client";

import { useState, useTransition } from "react";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { refreshReferenceRates } from "./actions";

/**
 * The freshness line under the converter, made pressable.
 *
 * "Updated 6 min ago" is exactly the thing you doubt when the number in front
 * of you looks wrong, so the timestamp itself is the button — there's no
 * second control to find, and the label already says what pressing it is for.
 *
 * A failed refresh is reported in place and leaves the cached rates alone:
 * the converter keeps working on the last good numbers rather than going
 * blank because the provider is down.
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
    <div className="flex items-center justify-between px-2">
      <span className="text-caps font-medium uppercase text-ink-5">
        Reference rates
      </span>

      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label="Refresh reference rates"
        className={cn(
          "-mr-2 flex items-center gap-1.5 rounded-pill px-2 py-1",
          "text-cat font-medium transition-colors",
          failed ? "text-cat-6" : "text-ink-5 active:text-ink-3",
          pending && "opacity-70",
        )}
      >
        <span className="tnum">
          {pending ? "Refreshing…" : failed ? "Couldn't reach provider" : freshness}
        </span>
        <RotateCw size={13} className={cn("shrink-0", pending && "animate-spin")} />
      </button>
    </div>
  );
}
