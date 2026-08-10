"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./Button";

/**
 * Submit button that disables itself while its form's action is in flight.
 * Must be rendered inside the <form> it submits.
 */
export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      // Both reasons to disable matter: a caller's validation gate and the
      // in-flight submission. Spreading props must not clobber either.
      disabled={pending || disabled}
      aria-busy={pending}
      {...props}
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
