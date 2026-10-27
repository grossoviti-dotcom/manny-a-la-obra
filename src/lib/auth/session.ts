import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Actor } from "@/lib/errors";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./token";

export async function createSession(user: { id: string; role: Actor["role"] }) {
  const token = await signSession({ sub: user.id, role: user.role });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Usuario actual leído de la base (el rol del token no se usa para autorizar). */
export const getCurrentUser = cache(async () => {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const [user] = await db
    .select({
      id: schema.users.id,
      role: schema.users.role,
      name: schema.users.name,
      email: schema.users.email,
      suspended: schema.users.suspended,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.sub))
    .limit(1);
  if (!user || user.suspended) return null;
  return user;
});

export async function getActor(): Promise<Actor | null> {
  const u = await getCurrentUser();
  return u ? { id: u.id, role: u.role } : null;
}

export async function requireUser(role?: Actor["role"] | Actor["role"][], next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  const roles = role ? (Array.isArray(role) ? role : [role]) : null;
  if (roles && !roles.includes(user.role)) redirect(homeForRole(user.role));
  return user;
}

export function homeForRole(role: Actor["role"]) {
  return role === "admin" ? "/admin" : role === "profesional" ? "/profesional" : "/cliente";
}
