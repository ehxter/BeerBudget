import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";

const BCRYPT_ROUNDS = 12;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * The single place the app resolves "who is making this request".
 *
 * Every server action, route handler, and page reads the user from here —
 * never from a client-supplied id — so a request can't be pointed at another
 * user's data by editing a payload.
 *
 * `cache` dedupes this to one query per request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await readSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true },
  });

  return user;
});

/** For pages: bounces to sign-in instead of rendering. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");
  return user;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
