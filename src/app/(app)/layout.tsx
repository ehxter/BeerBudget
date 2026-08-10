import { requireUser } from "@/lib/auth";
import { BottomNav } from "@/components/nav/BottomNav";
import { OfflineBanner } from "@/components/OfflineBanner";

/**
 * Shell for every signed-in screen.
 *
 * The auth check here is a convenience for redirecting, not the security
 * boundary — each page and action re-checks ownership against the session
 * before touching data.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <OfflineBanner />
      <main className="flex-1 px-4 pb-28 pt-3">{children}</main>
      <BottomNav />
    </div>
  );
}
