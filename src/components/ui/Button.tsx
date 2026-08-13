import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Every button in the app shares one material — a white fill at 6% opacity
 * with a light-grey label — regardless of shape. There is no separate
 * "primary" vs "in-card" colour tier; the only real variant is `quiet`,
 * which drops the fill entirely for tertiary actions (Cancel, Try again).
 */
type Variant = "solid" | "quiet";
type Size = "pill" | "block";

const VARIANTS: Record<Variant, string> = {
  solid: "bg-white/[0.06] text-ink-2 active:bg-white/[0.1]",
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
  variant = "solid",
  size = "pill",
  className,
  ...props
}: React.ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={classes(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "solid",
  size = "pill",
  className,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={classes(variant, size, className)} {...props} />;
}

/**
 * Same white/6% material as Button, shaped as a full-width row with the
 * Card radius instead of a pill — the navigational rows ("Spending
 * History", "Settlement") that sit at the bottom of a card stack.
 */
function cardClasses(className?: string) {
  return cn(
    "flex h-14 w-full items-center justify-center rounded-card",
    "bg-white/[0.06] text-meta font-medium text-ink-2 transition-colors active:bg-white/[0.1]",
    className,
  );
}

export function CardButton({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button className={cardClasses(className)} {...props}>
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
    <Link className={cardClasses(className)} {...props}>
      {children}
    </Link>
  );
}
