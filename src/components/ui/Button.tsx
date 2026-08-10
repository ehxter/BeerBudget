import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-accent/90 active:bg-accent/80 font-semibold",
  secondary:
    "bg-surface-2 text-ink border border-line hover:bg-surface-3 active:bg-surface-3",
  ghost: "text-ink-muted hover:text-ink hover:bg-surface-2",
  danger:
    "bg-negative-soft text-negative border border-negative/25 hover:bg-negative/15",
};

// Every size clears the 44px minimum touch target.
const SIZES: Record<Size, string> = {
  sm: "h-10 px-3 text-sm rounded-lg",
  md: "h-12 px-4 text-sm rounded-xl",
  lg: "h-14 px-5 text-base rounded-xl",
};

function classes(variant: Variant, size: Size, className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 transition-colors select-none",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:opacity-50 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={classes(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={classes(variant, size, className)} {...props} />;
}
