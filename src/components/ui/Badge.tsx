import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "positive" | "negative" | "warn" | "indigo" | "amber" | "emerald";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-3 text-ink-muted border-line-strong",
  accent: "bg-accent-soft text-accent border-accent/25",
  positive: "bg-positive-soft text-positive border-positive/25",
  negative: "bg-negative-soft text-negative border-negative/25",
  warn: "bg-warn-soft text-warn border-warn/25",
  // Aliases used by the place-status vocabulary.
  indigo: "bg-accent-soft text-accent border-accent/25",
  amber: "bg-warn-soft text-warn border-warn/25",
  emerald: "bg-positive-soft text-positive border-positive/25",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
