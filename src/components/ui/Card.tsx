import { cn } from "@/lib/cn";

/**
 * Figma card paddings, by literal frame:
 *   16  — uniform 16 (Cost Item, Exchange converter)
 *   18  — 16 vertical / 20 horizontal (Budget Left, STATS, Spending History
 *         button — no real Figma value is 18; it's a placeholder key so it
 *         doesn't collide with the uniform presets)
 *   20  — uniform 20
 *   24  — 24 vertical / 20 horizontal (Spending's category-bar-list card)
 */
export function Card({
  pad = 16,
  radius = "md",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  pad?: 16 | 18 | 20 | 24;
  /** "lg" is the 16px-radius STATS/donut card; every other card is 12px. */
  radius?: "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 bg-card",
        radius === "md" ? "rounded-card" : "rounded-card-lg",
        pad === 16 && "p-4",
        pad === 18 && "px-5 py-4",
        pad === 20 && "p-5",
        pad === 24 && "px-5 py-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * The small caps label inside a card — 13px, #5c5c5e.
 * ("BUDGET LEFT", "STATS", "NEW NOTE")
 */
export function CardLabel({ className, children }: React.ComponentProps<"h2">) {
  return (
    <h2 className={cn("text-caps font-semibold uppercase text-ink-5", className)}>
      {children}
    </h2>
  );
}

/**
 * The label/total row that sits above a group of cards.
 * Figma: 350x16 or 15, padding 0/8, space-between, 12px #5c5c5e left,
 * 12-13px #5c5c5e right.
 */
export function SectionHeader({
  label,
  value,
  className,
}: {
  label: React.ReactNode;
  value?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between px-2", className)}>
      <span className="text-caps font-medium uppercase text-ink-5">{label}</span>
      {value ? (
        <span className="tnum text-cat font-medium text-ink-5">{value}</span>
      ) : null}
    </div>
  );
}

/** Hairline used inside cards. Figma: 1px #47474a, or #2c2c2f for the softer one. */
export function Divider({ soft = false }: { soft?: boolean }) {
  return <div className={cn("h-px w-full", soft ? "bg-line-soft" : "bg-line")} />;
}
