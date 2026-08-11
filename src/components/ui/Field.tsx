import { cn } from "@/lib/cn";

const CONTROL = cn(
  "w-full rounded-card border border-transparent bg-track px-4 text-ink",
  "placeholder:text-ink-4",
  "focus:border-ink-3/40 focus:outline-none",
  "disabled:opacity-40",
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
        <span className="mb-2 block text-label font-semibold uppercase text-ink-5">
          {label}
        </span>
      ) : null}
      {children}
      {error ? (
        <span className="mt-2 block text-meta text-cat-6">{error}</span>
      ) : hint ? (
        <span className="mt-2 block text-meta text-ink-4">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(CONTROL, "h-12 text-row", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea className={cn(CONTROL, "min-h-24 py-3.5 text-row", className)} {...props} />
  );
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(CONTROL, "h-12 appearance-none pr-10 text-row", className)} {...props}>
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-4"
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

export function FormError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="rounded-card bg-card px-4 py-3.5 text-meta text-cat-6">
      {children}
    </div>
  );
}
