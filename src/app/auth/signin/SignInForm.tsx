"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "../actions";
import { Field, Input, FormError, SubmitButton } from "@/components/ui";

const initialState: AuthState = {};

export function SignInForm() {
  const [state, formAction] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError>{state.error}</FormError>

      <Field label="Email">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          required
          placeholder="you@example.com"
        />
      </Field>

      <Field label="Password">
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </Field>

      <SubmitButton size="block" className="mt-2" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
