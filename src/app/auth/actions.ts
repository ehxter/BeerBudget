"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";

export type AuthState = { error?: string };

const credentials = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export async function signIn(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // Deliberately vague: distinguishing "no such email" from "wrong password"
  // would let anyone probe which addresses have accounts.
  if (!parsed.success) return { error: "Email or password is incorrect" };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    // Still hash something so a missing account isn't detectably faster.
    await hashPassword(parsed.data.password);
    return { error: "Email or password is incorrect" };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { error: "Email or password is incorrect" };

  await createSession(user.id);
  redirect("/");
}

export async function signUp(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details" };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) return { error: "That email is already registered" };

  // Sign-up is open. Every account is a sealed private space — a new one can
  // see nothing but its own rows — so there is no shared data for an extra
  // account to reach, and nothing to gate it behind.
  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
    select: { id: true },
  });

  await createSession(user.id);
  redirect("/");
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/auth/signin");
}
