import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { DomainError, assertRole, type Actor } from "@/lib/errors";
import { LICENSED_CATEGORIES, VERIFICATION_VALIDITY_MONTHS } from "@/lib/constants";
import { profileSchema } from "@/lib/validation";
import { saveUpload } from "./files";
import { audit } from "@/lib/audit";
import { track } from "@/lib/analytics";
import { notify } from "@/lib/adapters/email";
import { identityProvider } from "@/lib/adapters/identity";

type DocType = (typeof schema.docTypeEnum.enumValues)[number];

export async function getOwnProfile(actor: Actor) {
  assertRole(actor, "profesional");
  const [p] = await db.select().from(schema.professionalProfiles).where(eq(schema.professionalProfiles.userId, actor.id));
  if (!p) throw new DomainError("No encontramos tu perfil profesional.", "not_found");
  return p;
}

export function requiredDocs(categories: string[]): DocType[] {
  const base: DocType[] = ["dni_frente", "dni_dorso", "selfie"];
  return categories.some((c) => LICENSED_CATEGORIES.includes(c)) ? [...base, "matricula"] : base;
}

export async function updateProfile(actor: Actor, input: z.input<typeof profileSchema>) {
  const current = await getOwnProfile(actor);
  if (current.verificationStatus === "en_revision") throw new DomainError("Tu perfil está en revisión; vas a poder editarlo cuando terminemos.");
  const data = profileSchema.parse(input);
  await db
    .update(schema.professionalProfiles)
    .set({
      tradeTitle: data.tradeTitle,
      categories: data.categories,
      bio: data.bio,
      yearsExperience: data.yearsExperience,
      zones: data.zones,
      referencePrice: data.referencePrice ?? null,
      priceUnit: data.priceUnit,
      availability: data.availability,
      licenseNumber: data.licenseNumber,
    })
    .where(eq(schema.professionalProfiles.userId, actor.id));
  await db.update(schema.users).set({ phone: data.phone }).where(eq(schema.users.id, actor.id));
}

export async function listOwnDocuments(actor: Actor) {
  assertRole(actor, "profesional");
  return db
    .select({
      id: schema.verificationDocuments.id,
      type: schema.verificationDocuments.type,
      status: schema.verificationDocuments.status,
      adminNotes: schema.verificationDocuments.adminNotes,
      createdAt: schema.verificationDocuments.createdAt,
      fileId: schema.verificationDocuments.fileId,
    })
    .from(schema.verificationDocuments)
    .where(eq(schema.verificationDocuments.professionalId, actor.id));
}

export async function uploadDocument(actor: Actor, type: DocType, file: File) {
  const profile = await getOwnProfile(actor);
  if (profile.verificationStatus === "en_revision") throw new DomainError("Tu documentación ya está en revisión.");
  const fileId = await saveUpload(actor.id, "verificacion", file);
  await db.transaction(async (tx) => {
    // Reemplaza un documento previo del mismo tipo.
    await tx
      .delete(schema.verificationDocuments)
      .where(and(eq(schema.verificationDocuments.professionalId, actor.id), eq(schema.verificationDocuments.type, type)));
    await tx.insert(schema.verificationDocuments).values({ professionalId: actor.id, type, fileId });
  });
  await audit(actor.id, "verification.upload", "verification_document", null, { type });
}

/** El profesional envía su perfil y documentos: pendiente | rechazado → en_revision. */
export async function submitForReview(actor: Actor) {
  const profile = await getOwnProfile(actor);
  if (profile.verificationStatus === "en_revision") throw new DomainError("Ya enviaste tu documentación.");
  if (profile.verificationStatus === "verificado" && profile.verificationExpiresAt && profile.verificationExpiresAt > new Date())
    throw new DomainError("Tu verificación está vigente.");
  if (!profile.tradeTitle || profile.categories.length === 0 || profile.zones.length === 0 || profile.bio.length < 30)
    throw new DomainError("Completá tu perfil (oficio, categorías, zonas y descripción) antes de enviar.");
  const docs = await listOwnDocuments(actor);
  const missing = requiredDocs(profile.categories).filter((t) => !docs.some((d) => d.type === t));
  if (missing.length) throw new DomainError("Faltan documentos obligatorios para enviar a revisión.");
  if (requiredDocs(profile.categories).includes("matricula") && !profile.licenseNumber)
    throw new DomainError("Ingresá tu número de matrícula en el perfil.");

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, actor.id));
  const result = await identityProvider.submit({
    professionalId: actor.id,
    fullName: user.name,
    documentFileIds: docs.map((d) => d.fileId),
  });

  await db
    .update(schema.professionalProfiles)
    .set({
      verificationStatus: "en_revision",
      verificationSubmittedAt: new Date(),
      rejectionReason: null,
      externalVerificationRef: result.reference,
    })
    .where(eq(schema.professionalProfiles.userId, actor.id));
  await audit(actor.id, "verification.submit", "professional", actor.id, { provider: identityProvider.name, outcome: result.outcome });
  await track("pro_verification_submitted", { userId: actor.id });
  await notify(user.email, "Recibimos tu documentación", "Nuestro equipo la revisa en 24 a 72 h hábiles. Te avisamos por este medio.");
}

export async function adminVerificationQueue(actor: Actor) {
  assertRole(actor, "admin");
  return db
    .select({
      userId: schema.professionalProfiles.userId,
      name: schema.users.name,
      email: schema.users.email,
      tradeTitle: schema.professionalProfiles.tradeTitle,
      status: schema.professionalProfiles.verificationStatus,
      submittedAt: schema.professionalProfiles.verificationSubmittedAt,
      expiresAt: schema.professionalProfiles.verificationExpiresAt,
      categories: schema.professionalProfiles.categories,
      isDemo: schema.users.isDemo,
    })
    .from(schema.professionalProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.professionalProfiles.userId))
    .orderBy(schema.professionalProfiles.verificationSubmittedAt);
}

export async function adminGetVerification(actor: Actor, professionalId: string) {
  assertRole(actor, "admin");
  const [row] = await db
    .select({ profile: schema.professionalProfiles, user: schema.users })
    .from(schema.professionalProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.professionalProfiles.userId))
    .where(eq(schema.professionalProfiles.userId, professionalId));
  if (!row) throw new DomainError("Profesional no encontrado.", "not_found");
  const docs = await db
    .select()
    .from(schema.verificationDocuments)
    .where(eq(schema.verificationDocuments.professionalId, professionalId));
  return { ...row, docs };
}

export async function adminApprove(actor: Actor, professionalId: string, notes?: string) {
  assertRole(actor, "admin");
  const { profile, user, docs } = await adminGetVerification(actor, professionalId);
  if (profile.verificationStatus !== "en_revision") throw new DomainError("Sólo se pueden aprobar perfiles en revisión.");
  const missing = requiredDocs(profile.categories).filter((t) => !docs.some((d) => d.type === t));
  if (missing.length) throw new DomainError("Faltan documentos obligatorios.");
  const now = new Date();
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + VERIFICATION_VALIDITY_MONTHS);
  await db.transaction(async (tx) => {
    await tx
      .update(schema.professionalProfiles)
      .set({ verificationStatus: "verificado", verifiedAt: now, verificationExpiresAt: expires, rejectionReason: null })
      .where(eq(schema.professionalProfiles.userId, professionalId));
    await tx
      .update(schema.verificationDocuments)
      .set({ status: "aprobado", adminNotes: notes || null })
      .where(eq(schema.verificationDocuments.professionalId, professionalId));
    await audit(actor.id, "verification.approve", "professional", professionalId, { notes }, tx);
  });
  await track("pro_verified", { userId: professionalId });
  await notify(user.email, "¡Tu perfil fue verificado!", "Ya aparecés en las búsquedas de Manny a la Obra con la insignia Verificado.");
}

export async function adminReject(actor: Actor, professionalId: string, reason: string, rejectedDocIds: string[] = []) {
  assertRole(actor, "admin");
  const trimmed = reason.trim();
  if (trimmed.length < 10) throw new DomainError("Explicá el motivo del rechazo (mín. 10 caracteres).");
  const { profile, user } = await adminGetVerification(actor, professionalId);
  if (profile.verificationStatus !== "en_revision") throw new DomainError("Sólo se pueden rechazar perfiles en revisión.");
  await db.transaction(async (tx) => {
    await tx
      .update(schema.professionalProfiles)
      .set({ verificationStatus: "rechazado", rejectionReason: trimmed })
      .where(eq(schema.professionalProfiles.userId, professionalId));
    if (rejectedDocIds.length)
      await tx
        .update(schema.verificationDocuments)
        .set({ status: "rechazado", adminNotes: trimmed })
        .where(
          and(
            eq(schema.verificationDocuments.professionalId, professionalId),
            inArray(schema.verificationDocuments.id, rejectedDocIds),
          ),
        );
    await audit(actor.id, "verification.reject", "professional", professionalId, { reason: trimmed }, tx);
  });
  await notify(user.email, "Necesitamos que revises tu documentación", `Motivo: ${trimmed}. Podés corregirla y volver a enviarla.`);
}
