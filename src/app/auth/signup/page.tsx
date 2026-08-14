import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignUpForm } from "./SignUpForm";

export const metadata = { title: "Create account · Beer Budget" };

/**
 * Sign-up is open to anyone.
 *
 * There is nothing to gate it behind: every account is a sealed private space
 * that can see only its own rows, so an extra one reaches no shared data —
 * there isn't any.
 */
export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="animate-rise flex flex-col gap-8">
      <div>
        <h1 className="text-title font-semibold text-ink">Create account</h1>
        <p className="mt-1 text-meta text-ink-4">
          Your own private space. Nobody else&apos;s account can see any of it.
        </p>
      </div>

      <SignUpForm />

      <p className="text-center text-meta text-ink-4">
        Already have an account?{" "}
        <Link href="/auth/signin" className="font-medium text-ink">
          Sign in
        </Link>
      </p>
    </div>
  );
}
