import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  /** Renders a back chevron linking here. */
  back?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 pb-1 pt-1">
      {back ? (
        <Link
          href={back}
          aria-label="Back"
          className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-2 hover:text-ink"
        >
          <ChevronLeft size={22} />
        </Link>
      ) : null}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[22px] font-bold leading-tight tracking-tight text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-ink-faint">{subtitle}</p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
