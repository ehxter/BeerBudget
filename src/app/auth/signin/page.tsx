import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignInForm } from "./SignInForm";

export const metadata = { title: "Sign in · Koskalak Planner" };

export default async function SignInPage() {
  // Already signed in — no reason to show the form again.
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="animate-rise">
      <div className="mb-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-2xl">
          🕌
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Koskalak Planner</h1>
        <p className="mt-1 text-sm text-ink-faint">Sign in to your trip.</p>
      </div>

      <SignInForm />

      <p className="mt-6 text-center text-sm text-ink-faint">
        No account yet?{" "}
        <Link href="/auth/signup" className="font-medium text-accent hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
