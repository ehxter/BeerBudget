import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { SubmitButton } from "@/components/ui";

/**
 * Sign-out is a POST via a server action, not a link — a GET logout can be
 * triggered by any page that embeds the URL.
 */
export function SignOutButton({
  className,
  variant = "secondary",
}: {
  className?: string;
  variant?: React.ComponentProps<typeof SubmitButton>["variant"];
}) {
  return (
    <form action={signOut}>
      <SubmitButton variant={variant} className={className} pendingLabel="Signing out…">
        <LogOut size={16} />
        Sign out
      </SubmitButton>
    </form>
  );
}
