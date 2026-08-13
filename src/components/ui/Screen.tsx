import { cn } from "@/lib/cn";
import { PageHeader } from "./PageHeader";

/**
 * Page chrome. Every Figma body wrapper uses 20px padding on all sides — the
 * only thing that varies per screen is the vertical gap between the cards:
 * 16 on Home/Spending/Vault/Me, 32 on Exchange, 28 on History.
 *
 * `pb-28` overrides the literal 20px bottom padding — the Figma frames are
 * static mockups sized to their content, but the real app scrolls behind a
 * fixed bottom nav and needs the clearance.
 */
export function Screen({
  logo,
  back,
  title,
  action,
  gap = 4,
  className,
  children,
}: {
  /** Root screens show the logo lockup; pushed ones pass `back` + `title`. */
  logo?: boolean;
  back?: string;
  title?: string;
  action?: React.ReactNode;
  /** Tailwind gap step: 4 = 16px, 7 = 28px, 8 = 32px. */
  gap?: 4 | 7 | 8;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHeader logo={logo} back={back} title={title} action={action} />
      <div
        className={cn(
          "flex flex-col px-5 pt-5 pb-28",
          gap === 4 && "gap-4",
          gap === 7 && "gap-7",
          gap === 8 && "gap-8",
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}
