import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignUpForm } from "./SignUpForm";
import { Card } from "@/components/ui";

export const metadata = { title: "Create account · Istanbul" };

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/");

  // The trip has room for exactly two people.
  const userCount = await prisma.user.count();
  const isFull = userCount >= 2;

  return (
    <div className="animate-rise">
      <div className="mb-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-2xl">
          🕌
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Create account</h1>
        <p className="mt-1 text-sm text-ink-faint">
          {isFull
            ? "Both travelers have already signed up."
            : "You're the second traveler on this trip."}
        </p>
      </div>

      {isFull ? (
        <Card className="text-sm text-ink-muted">
          This trip already has its two travelers. Sign in with an existing
          account instead.
        </Card>
      ) : (
        <SignUpForm />
      )}

      <p className="mt-6 text-center text-sm text-ink-faint">
        Already have an account?{" "}
        <Link href="/auth/signin" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
