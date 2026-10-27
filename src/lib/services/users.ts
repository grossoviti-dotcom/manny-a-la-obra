import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { DomainError } from "@/lib/errors";
import { registerSchema, loginSchema } from "@/lib/validation";
import { track } from "@/lib/analytics";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/adapters/email";

export async function registerUser(input: z.input<typeof registerSchema>) {
  const data = registerSchema.parse(input);
  const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, data.email));
  if (existing.length) throw new DomainError("Ya existe una cuenta con ese email.", "conflict");

  const passwordHash = await hashPassword(data.password);
  const user = await db.transaction(async (tx) => {
    const [u] = await tx
      .insert(schema.users)
      .values({ role: data.role, name: data.name, email: data.email, phone: data.phone, passwordHash })
      .returning();
    if (data.role === "profesional") await tx.insert(schema.professionalProfiles).values({ userId: u.id });
    await audit(u.id, "user.register", "user", u.id, { role: u.role }, tx);
    return u;
  });

  await track("user_registered", { userId: user.id, props: { role: user.role } });
  if (user.role === "profesional") await track("pro_signup_started", { userId: user.id });
  await notify(
    user.email,
    "¡Bienvenido/a a Manny a la Obra!",
    user.role === "profesional"
      ? "Completá tu perfil y subí tu documentación para que podamos verificarte."
      : "Ya podés buscar profesionales verificados y pedir presupuestos.",
  );
  return { id: user.id, role: user.role, name: user.name };
}

export async function authenticate(input: z.input<typeof loginSchema>) {
  const data = loginSchema.parse(input);
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, data.email)).limit(1);
  // Mismo mensaje para email inexistente o contraseña incorrecta.
  const ok = user ? await verifyPassword(data.password, user.passwordHash) : false;
  if (!user || !ok) throw new DomainError("Email o contraseña incorrectos.");
  if (user.suspended) throw new DomainError("Tu cuenta está suspendida. Escribinos a soporte.");
  return { id: user.id, role: user.role, name: user.name };
}
