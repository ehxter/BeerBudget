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
  const isFull = (await prisma.user.count()) >= 2;

  return (
    <div className="animate-rise flex flex-col gap-8">
      <div>
        <h1 className="text-title font-semibold text-ink">Create account</h1>
        <p className="mt-1 text-meta text-ink-4">
          {isFull
            ? "Both travelers have already signed up."
            : "You're the second traveler on this trip."}
        </p>
      </div>

      {isFull ? (
        <Card pad={16}>
          <p className="text-meta text-ink-3">
            This trip already has its two travelers. Sign in with an existing
            account instead.
          </p>
        </Card>
      ) : (
        <SignUpForm />
      )}

      <p className="text-center text-meta text-ink-4">
        Already have an account?{" "}
        <Link href="/auth/signin" className="font-medium text-ink">
          Sign in
        </Link>
      </p>
    </div>
  );
}
