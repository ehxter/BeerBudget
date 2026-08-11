import { requireUser } from "@/lib/auth";
import { BottomNav } from "@/components/nav/BottomNav";
import { OfflineBanner } from "@/components/OfflineBanner";

/**
 * Shell for every signed-in screen. Pages supply their own header via
 * <Screen>, matching the Figma frames where the title and its action pills are
 * part of the screen rather than a shared bar.
 *
 * The auth check here is for redirecting only — every page and action
 * re-checks ownership against the session before touching data.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-canvas">
      <OfflineBanner />
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}
