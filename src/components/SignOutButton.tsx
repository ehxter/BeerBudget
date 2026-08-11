import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { CardButton } from "@/components/ui";

/**
 * Sign-out is a POST via a server action, not a link — a GET logout can be
 * triggered by any page that embeds the URL.
 */
export function SignOutButton() {
  return (
    <form action={signOut}>
      <CardButton type="submit">
        <LogOut size={16} className="mr-1.5" />
        Sign out
      </CardButton>
    </form>
  );
}
