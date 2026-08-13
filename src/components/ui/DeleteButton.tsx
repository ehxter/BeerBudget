"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Destructive control with the confirmation built in.
 *
 * The first tap swaps the bin for a red "Delete?" pill; only the second tap
 * actually deletes. An inline two-step beats `window.confirm` here — it can't
 * be dismissed by a mis-tap on a phone, it doesn't blur the whole app behind a
 * system dialog, and it says which row it's about because it *is* the row.
 *
 * The armed state disarms itself after a few seconds, so a confirmation left
 * on screen can never be completed by an unrelated tap later.
 */
export function DeleteButton({
  onDelete,
  label,
  className,
}: {
  onDelete: () => Promise<void> | void;
  /** Accessible name — include what is being deleted. */
  label: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!armed) return;
    timer.current = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer.current);
  }, [armed]);

  function handleClick() {
    if (!armed) {
      setArmed(true);
      return;
    }
    clearTimeout(timer.current);
    setArmed(false);
    startTransition(async () => {
      await onDelete();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={armed ? `Confirm delete: ${label}` : label}
      className={cn(
        "flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full transition-colors",
        armed
          ? "bg-cat-6/15 px-3 text-cat-6"
          : "w-8 text-ink-5 active:bg-white/[0.06] active:text-ink-3",
        pending && "opacity-40",
        className,
      )}
    >
      <Trash2 size={15} />
      {armed ? (
        <span className="text-label font-medium">Delete?</span>
      ) : null}
    </button>
  );
}
