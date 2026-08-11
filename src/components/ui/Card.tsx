import { cn } from "@/lib/cn";

/**
 * Figma card paddings, by literal frame:
 *   16  — uniform 16 (Cost Item, Exchange converter)
 *   18  — 16 vertical / 20 horizontal (Budget Left, STATS, Spending History
 *         button — no real Figma value is 18; it's a placeholder key so it
 *         doesn't collide with the uniform presets)
 *   20  — uniform 20 (Next Event, Trip/Wishlist event cards)
 *   24  — 24 vertical / 20 horizontal (Spending's category-bar-list card)
 */
export function Card({
  pad = 16,
  radius = "md",
  glow = false,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  pad?: 16 | 18 | 20 | 24;
  /** "lg" is the 16px-radius STATS/donut card; every other card is 12px. */
  radius?: "md" | "lg";
  /** The amber highlight on the featured "Next Event" card. */
  glow?: boolean;
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
        glow && "border border-glow shadow-[0_0_16px_4px_rgba(233,182,88,0.25)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * The small caps label inside a card — Figma: 12px, #5c5c5e.
 * ("NEXT EVENT", "BUDGET LEFT", "STATS", "RECENT EXCHANGES")
 */
export function CardLabel({ className, children }: React.ComponentProps<"h2">) {
  return (
    <h2 className={cn("text-label font-semibold uppercase text-ink-5", className)}>
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
      <span className="text-label font-medium uppercase text-ink-5">{label}</span>
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
