"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getActor } from "@/lib/auth/session";
import { DomainError, assertRole, toActionError, type ActionState } from "@/lib/errors";
import { saveUpload } from "@/lib/services/files";
import { submitForReview, updateProfile, uploadDocument } from "@/lib/services/verification";

async function pro() {
  const a = await getActor();
  assertRole(a, "profesional");
  return a;
}

export async function updateProfileAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const a = await pro();
    await updateProfile(a, {
      tradeTitle: String(form.get("tradeTitle") ?? ""),
      categories: form.getAll("categories").map(String) as never,
      bio: String(form.get("bio") ?? ""),
      yearsExperience: form.get("yearsExperience") as string,
      zones: form.getAll("zones").map(String),
      referencePrice: (form.get("referencePrice") as string) || undefined,
      priceUnit: String(form.get("priceUnit") ?? "visita") as never,
      availability: String(form.get("availability") ?? "esta_semana") as never,
      licenseNumber: String(form.get("licenseNumber") ?? ""),
      phone: String(form.get("phone") ?? ""),
    });
    const avatar = form.get("avatar");
    if (avatar instanceof File && avatar.size > 0) {
      const fileId = await saveUpload(a.id, "avatar", avatar);
      await db.update(schema.professionalProfiles).set({ avatarFileId: fileId }).where(eq(schema.professionalProfiles.userId, a.id));
    }
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/profesional", "layout");
  return { ok: true, message: "Perfil guardado." };
}

const DOC_TYPES = ["dni_frente", "dni_dorso", "selfie", "matricula"] as const;

export async function uploadDocumentAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const type = String(form.get("type"));
    if (!DOC_TYPES.includes(type as never)) throw new DomainError("Tipo de documento inválido.");
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw new DomainError("Elegí un archivo.");
    await uploadDocument(await pro(), type as (typeof DOC_TYPES)[number], file);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/profesional/verificacion");
  return { ok: true, message: "Documento subido." };
}

export async function submitVerificationAction(_: ActionState): Promise<ActionState> {
  try {
    await submitForReview(await pro());
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/profesional", "layout");
  return { ok: true, message: "¡Enviado! Revisamos tu documentación en 24 a 72 h hábiles." };
}
