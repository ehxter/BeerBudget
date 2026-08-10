import { cn } from "@/lib/cn";

const CONTROL = cn(
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 text-ink",
  "placeholder:text-ink-faint",
  "focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/25",
  "disabled:opacity-50",
);

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label ? (
        <span className="mb-1.5 block text-xs font-medium text-ink-muted">{label}</span>
      ) : null}
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-negative">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-ink-faint">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(CONTROL, "h-12 text-[15px]", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea className={cn(CONTROL, "min-h-24 py-3 text-[15px]", className)} {...props} />
  );
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          CONTROL,
          "h-12 appearance-none pr-9 text-[15px]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 6l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Renders a server-action error returned as a plain string. */
export function FormError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-negative/25 bg-negative-soft px-3.5 py-3 text-sm text-negative"
    >
      {children}
    </div>
  );
}
