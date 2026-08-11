import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-card bg-card px-5 py-10 text-center", className)}>
      {icon ? (
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-track">
          {icon}
        </div>
      ) : null}
      <p className="text-row font-medium text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-[34ch] text-meta leading-relaxed text-ink-4">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
