import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignInForm } from "./SignInForm";

export const metadata = { title: "Sign in · Istanbul" };

export default async function SignInPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="animate-rise flex flex-col gap-8">
      <div>
        <h1 className="text-title font-semibold text-ink">Istanbul</h1>
        <p className="mt-1 text-meta text-ink-4">Sign in to your trip.</p>
      </div>

      <SignInForm />

      <p className="text-center text-meta text-ink-4">
        No account yet?{" "}
        <Link href="/auth/signup" className="font-medium text-ink">
          Create one
        </Link>
      </p>
    </div>
  );
}
