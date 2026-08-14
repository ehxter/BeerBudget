"use client";

import { cn } from "@/lib/cn";

/**
 * On/off switch, in the same two colours as the selected chip: the white
 * primary fill when on, the track grey when off.
 *
 * Not in the Figma frames — derived from the chip language there, because a
 * setting with exactly two states reads better as a switch than as a pair of
 * pills competing for the same row.
 */
export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** Announced to screen readers — the visible text sits beside the control. */
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-pill transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-3",
        checked ? "bg-action" : "bg-track",
        disabled && "opacity-40",
      )}
    >
      {/* left-0 is load-bearing: without it the knob is placed at its static
          position, and a button centres its content — so the offsets below
          would measure from the middle of the track and hang the knob off the
          end of it. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-1 size-5 rounded-full transition-transform",
          checked ? "translate-x-6 bg-action-ink" : "translate-x-1 bg-ink-4",
        )}
      />
    </button>
  );
}
