import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Figma: 390x72, padding 24/20/8/20. Every bottom-nav-root screen (Home,
 * Spending, Vault, Exchange, Me) shows the app's logo lockup on the left —
 * never a screen-specific title. Pushed screens (Settlement, History, forms)
 * swap the logo for a back arrow + their own title instead. The right side is
 * always a single pill, whose label is the one thing that actually changes per
 * screen ("Add Cost", "Log Exchange", …).
 */
export function PageHeader({
  logo = false,
  back,
  title,
  action,
}: {
  /** Root screens show the lockup instead of a title. */
  logo?: boolean;
  back?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-4 px-5 pb-2 pt-6">
      <div className="flex min-w-0 items-center gap-1">
        {back ? (
          <Link
            href={back}
            aria-label="Back"
            className="-ml-3 flex size-12 shrink-0 items-center justify-center"
          >
            <ChevronLeft size={24} className="text-ink" />
          </Link>
        ) : null}

        {logo ? (
          <Image
            src="/logo.svg"
            alt="Beer Budget"
            width={160}
            height={30}
            priority
            className="h-[30px] w-auto"
          />
        ) : (
          <h1 className={cn("truncate text-title font-semibold text-ink-2")}>{title}</h1>
        )}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
