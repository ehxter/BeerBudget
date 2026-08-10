"use client";

import { useActionState } from "react";
import { signUp, type AuthState } from "../actions";
import { Field, Input, FormError, SubmitButton } from "@/components/ui";

const initialState: AuthState = {};

export function SignUpForm() {
  const [state, formAction] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormError>{state.error}</FormError>

      <Field label="Name">
        <Input name="name" autoComplete="name" required placeholder="Your name" />
      </Field>

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

      <Field label="Password" hint="At least 8 characters.">
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
        />
      </Field>

      <SubmitButton size="lg" className="w-full" pendingLabel="Creating…">
        Create account
      </SubmitButton>
    </form>
  );
}
