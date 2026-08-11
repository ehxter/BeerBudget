import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getActiveTrip } from "@/lib/trip";
import { prisma } from "@/lib/prisma";
import { Card, CardLabel } from "@/components/ui";
import { SignOutButton } from "@/components/SignOutButton";

export const metadata = { title: "Setup · Istanbul" };

/**
 * Shown when the signed-in account has no trip to look at — either the seed
 * hasn't run, or this account isn't a member of the trip that exists.
 */
export default async function SetupPage() {
  const user = await requireUser();
  const trip = await getActiveTrip();

  if (trip) {
    const membership = await prisma.tripMember.findUnique({
      where: { userId_tripId: { userId: user.id, tripId: trip.id } },
      select: { id: true },
    });
    // A member landing here has nothing to set up.
    if (membership) redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center gap-6 bg-canvas px-6 py-10">
      <div>
        <h1 className="text-title font-semibold text-ink">Almost there</h1>
        <p className="mt-1 text-meta text-ink-4">Signed in as {user.email}</p>
      </div>

      <Card pad={20}>
        <CardLabel>{trip ? "Not on this trip" : "No trip yet"}</CardLabel>
        <p className="text-meta leading-relaxed text-ink-3">
          {trip ? (
            <>
              A trip exists but this account isn&apos;t one of its two
              travelers. Sign in with the right account, or add this one to the
              trip on the server.
            </>
          ) : (
            <>
              The trip hasn&apos;t been created yet. On the server, fill in the{" "}
              <code className="rounded bg-track px-1 py-0.5 text-label">SEED_*</code>{" "}
              values in{" "}
              <code className="rounded bg-track px-1 py-0.5 text-label">.env</code> and
              run:
            </>
          )}
        </p>
        {!trip ? (
          <pre className="overflow-x-auto rounded-card bg-canvas p-3 text-label text-ink-3">
            npm run db:seed
          </pre>
        ) : null}
      </Card>

      <SignOutButton />
    </div>
  );
}
