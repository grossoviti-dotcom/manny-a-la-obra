import { deflateSync } from "node:zlib";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { hashPassword } from "@/lib/auth/password";
import { registerUser } from "@/lib/services/users";
import { updateProfile, uploadDocument, submitForReview, adminApprove } from "@/lib/services/verification";
import type { Actor } from "@/lib/errors";

export const uid = () => Math.random().toString(36).slice(2, 10);

export function pngFile(name = "doc.png") {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const body = Buffer.concat([header, deflateSync(Buffer.alloc(64))]);
  return new File([new Uint8Array(body)], name, { type: "image/png" });
}

export async function makeClient(): Promise<Actor> {
  const u = await registerUser({ name: "Cliente Test", email: `cliente-${uid()}@test.example`, password: "clave-segura-1", role: "cliente" });
  return { id: u.id, role: "cliente" };
}

export async function makeAdmin(): Promise<Actor> {
  const [u] = await db
    .insert(schema.users)
    .values({ role: "admin", name: "Admin Test", email: `admin-${uid()}@test.example`, passwordHash: await hashPassword("x-admin-pass-1") })
    .returning();
  return { id: u.id, role: "admin" };
}

export async function makePro(opts: { verify?: Actor; category?: "electricidad" | "plomeria" } = {}): Promise<Actor> {
  const u = await registerUser({ name: "Profesional Test", email: `pro-${uid()}@test.example`, password: "clave-segura-1", role: "profesional" });
  const pro: Actor = { id: u.id, role: "profesional" };
  const category = opts.category ?? "plomeria";
  await updateProfile(pro, {
    tradeTitle: "Plomero de prueba",
    categories: [category],
    bio: "Bio de prueba con más de treinta caracteres para validar.",
    yearsExperience: 5,
    zones: ["Centro"],
    referencePrice: 20000,
    priceUnit: "visita",
    availability: "hoy",
    licenseNumber: category === "electricidad" ? "MP-1" : "",
    phone: "",
  });
  for (const t of ["dni_frente", "dni_dorso", "selfie", ...(category === "electricidad" ? ["matricula"] : [])] as const)
    await uploadDocument(pro, t, pngFile());
  await submitForReview(pro);
  if (opts.verify) await adminApprove(opts.verify, pro.id);
  return pro;
}

export async function profileOf(id: string) {
  const [p] = await db.select().from(schema.professionalProfiles).where(eq(schema.professionalProfiles.userId, id));
  return p;
}
