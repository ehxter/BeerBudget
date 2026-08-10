import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface p-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Small uppercase label that titles a card or a section of one. */
export function CardLabel({ className, children }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint",
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** A label/value line — the workhorse of the dense money screens. */
export function Row({
  label,
  value,
  hint,
  valueClassName,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <div className="min-w-0">
        <div className="truncate text-sm text-ink-muted">{label}</div>
        {hint ? <div className="mt-0.5 text-xs text-ink-faint">{hint}</div> : null}
      </div>
      <div className={cn("tnum shrink-0 text-sm font-semibold", valueClassName)}>
        {value}
      </div>
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <CardLabel>{children}</CardLabel>
      {action}
    </div>
  );
}
