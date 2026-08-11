import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Pill buttons, from Figma. Every pill is white and r1000 — the only
 * variation is the label colour, which the design uses as a prominence tier:
 *
 *   primary — black label. The header CTA ("Add Cost", "Add Event", "Log
 *             Exchange", "Add Budget", "Add Item") — one per screen.
 *   onCard  — ink-2 (grey) label. In-card pills ("Google Maps", "Spendings",
 *             "Edit Budget", "Move to Agenda").
 *   quiet   — no fill, for tertiary/cancel actions the design doesn't cover.
 *
 * Header pills are 40px tall with 11/20 padding.
 */
type Variant = "primary" | "onCard" | "quiet";
type Size = "pill" | "block";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-action text-action-ink active:bg-action/85",
  onCard: "bg-action text-action-ink-soft active:bg-action/85",
  quiet: "text-ink-4 active:text-ink",
};

const SIZES: Record<Size, string> = {
  pill: "h-10 px-5",
  block: "h-[42px] w-full px-[57px]",
};

function classes(variant: Variant, size: Size, className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-pill",
    "text-meta font-medium transition-colors select-none",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-3",
    "disabled:opacity-40 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "pill",
  className,
  ...props
}: React.ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={classes(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "pill",
  className,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={classes(variant, size, className)} {...props} />;
}

/**
 * The dark, full-width, r12 button-as-card — "Spending History" in the
 * Figma frames. A different shape language from the white pills: this is a
 * navigational row, not a call to action, so it borrows the Card radius
 * instead of the pill radius.
 */
export function CardButton({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "flex h-14 w-full items-center justify-center rounded-card bg-card",
        "text-meta font-semibold text-ink-2 transition-colors active:bg-track",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function CardButtonLink({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "flex h-14 w-full items-center justify-center rounded-card bg-card",
        "text-meta font-semibold text-ink-2 transition-colors active:bg-track",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
