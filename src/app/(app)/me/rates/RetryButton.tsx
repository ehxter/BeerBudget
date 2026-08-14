"use client";

import { useState, useTransition } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { retryProviders } from "./actions";

/**
 * Asks every provider again, past whatever cooldown a recent failure left
 * behind — a deliberate press is exactly when it's worth finding out whether
 * the connection came back.
 *
 * Reports which half answered, because on this screen that is the actionable
 * part: a dead Toman leg is what the rate above is for.
 */
export function RetryButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ rates: boolean; fx: boolean } | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      setResult(await retryProviders());
    });
  }

  const message = !result
    ? null
    : result.rates && result.fx
      ? "Both providers answered."
      : result.rates
        ? "Toman updated. Cross rates unreachable."
        : result.fx
          ? "Cross rates updated. BrsApi unreachable."
          : "Nothing reachable right now.";

  return (
    <div className="flex items-center justify-between gap-3">
      <Button type="button" variant="quiet" onClick={handleClick} disabled={pending}>
        <RotateCw size={14} className={cn(pending && "animate-spin")} />
        {pending ? "Retrying…" : "Retry now"}
      </Button>

      {message ? (
        <span
          className={cn(
            "text-meta",
            result?.rates && result.fx ? "text-ink-4" : "text-cat-6",
          )}
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}
