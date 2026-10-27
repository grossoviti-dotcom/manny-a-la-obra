import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closeDb, db, schema } from "@/db";
import type { Actor } from "@/lib/errors";
import { authenticate, registerUser } from "@/lib/services/users";
import { adminApprove, adminReject, submitForReview, uploadDocument } from "@/lib/services/verification";
import { getPublicProfile, searchProfessionals } from "@/lib/services/search";
import { createRequest, finishJob, getRequestDetail, hireQuote, respondQuote, sendMessage, startJob } from "@/lib/services/requests";
import { createReview, moderateReview, suspicionReason } from "@/lib/services/reviews";
import { adminUpdateClaim, getClaimForActor, openClaim } from "@/lib/services/claims";
import { canAccessFile } from "@/lib/services/files";
import { getMetrics } from "@/lib/services/metrics";
import { makeAdmin, makeClient, makePro, pngFile, profileOf, uid } from "./helpers";

let admin: Actor;
beforeAll(async () => {
  admin = await makeAdmin();
});
afterAll(async () => {
  await closeDb();
});

const baseRequest = (proIds: string[]) => ({
  categorySlug: "plomeria" as const,
  title: "Pérdida en la cocina",
  description: "Gotea el caño debajo de la bacha desde hace días.",
  zone: "Centro",
  urgency: "media" as const,
  desiredDate: "",
  professionalIds: proIds,
});

describe("registro e ingreso", () => {
  it("registra, rechaza emails duplicados y valida la contraseña", async () => {
    const email = `nuevo-${uid()}@test.example`;
    await registerUser({ name: "Nueva Persona", email, password: "clave-segura-1", role: "cliente" });
    await expect(registerUser({ name: "Otra", email, password: "clave-segura-1", role: "cliente" })).rejects.toThrow(/Ya existe/);
    await expect(authenticate({ email, password: "incorrecta" })).rejects.toThrow(/incorrectos/);
    const ok = await authenticate({ email: email.toUpperCase(), password: "clave-segura-1" });
    expect(ok.role).toBe("cliente");
  });

  it("no permite auto-asignarse el rol admin", async () => {
    await expect(
      registerUser({ name: "Hacker", email: `h-${uid()}@test.example`, password: "clave-segura-1", role: "admin" as never }),
    ).rejects.toThrow();
  });
});

describe("verificación de profesionales", () => {
  it("sólo aparece en búsquedas después de que un admin lo verifica", async () => {
    const pro = await makePro();
    expect((await profileOf(pro.id)).verificationStatus).toBe("en_revision");
    const before = await searchProfessionals({ categoria: "plomeria" });
    expect(before.some((p) => p.id === pro.id)).toBe(false);
    expect(await getPublicProfile(pro.id)).toBeNull();

    // Un cliente o el propio profesional no pueden aprobar.
    const client = await makeClient();
    await expect(adminApprove(client, pro.id)).rejects.toThrow(/permiso/);
    await expect(adminApprove(pro, pro.id)).rejects.toThrow(/permiso/);

    await adminApprove(admin, pro.id);
    const p = await profileOf(pro.id);
    expect(p.verificationStatus).toBe("verificado");
    expect(p.verificationExpiresAt!.getTime()).toBeGreaterThan(Date.now() + 300 * 864e5);
    const after = await searchProfessionals({ categoria: "plomeria" });
    expect(after.some((x) => x.id === pro.id)).toBe(true);
  });

  it("rechazo con motivo y reenvío", async () => {
    const pro = await makePro();
    await expect(adminReject(admin, pro.id, "corto")).rejects.toThrow(/motivo/);
    await adminReject(admin, pro.id, "La foto del DNI está borrosa.");
    expect((await profileOf(pro.id)).verificationStatus).toBe("rechazado");
    await uploadDocument(pro, "dni_frente", pngFile());
    await submitForReview(pro);
    expect((await profileOf(pro.id)).verificationStatus).toBe("en_revision");
  });

  it("la verificación vencida oculta el perfil (revalidación)", async () => {
    const pro = await makePro({ verify: admin });
    await db.update(schema.professionalProfiles).set({ verificationExpiresAt: new Date(Date.now() - 1000) }).where(eq(schema.professionalProfiles.userId, pro.id));
    expect(await getPublicProfile(pro.id)).toBeNull();
  });

  it("exige matrícula en electricidad", async () => {
    const u = await registerUser({ name: "Electricista", email: `e-${uid()}@test.example`, password: "clave-segura-1", role: "profesional" });
    const pro: Actor = { id: u.id, role: "profesional" };
    const { updateProfile } = await import("@/lib/services/verification");
    await updateProfile(pro, { tradeTitle: "Electricista", categories: ["electricidad"], bio: "x".repeat(40), yearsExperience: 3, zones: ["Centro"], priceUnit: "visita", availability: "hoy", licenseNumber: "", phone: "" });
    for (const t of ["dni_frente", "dni_dorso", "selfie"] as const) await uploadDocument(pro, t, pngFile());
    await expect(submitForReview(pro)).rejects.toThrow(/Faltan documentos/);
  });

  it("los documentos de verificación sólo los ven el dueño y admins", async () => {
    const pro = await makePro();
    const [doc] = await db.select().from(schema.verificationDocuments).where(eq(schema.verificationDocuments.professionalId, pro.id));
    const client = await makeClient();
    const otherPro = await makePro();
    expect((await canAccessFile(null, doc.fileId)).allowed).toBe(false);
    expect((await canAccessFile(client, doc.fileId)).allowed).toBe(false);
    expect((await canAccessFile(otherPro, doc.fileId)).allowed).toBe(false);
    expect((await canAccessFile(pro, doc.fileId)).allowed).toBe(true);
    expect((await canAccessFile(admin, doc.fileId)).allowed).toBe(true);
  });

  it("rechaza archivos que no son imagen o PDF aunque digan serlo", async () => {
    const pro = await makePro();
    await adminReject(admin, pro.id, "Motivo de prueba suficiente.");
    const fake = new File([new TextEncoder().encode("<script>alert(1)</script>")], "x.png", { type: "image/png" });
    await expect(uploadDocument(pro, "selfie", fake)).rejects.toThrow(/Formato/);
  });
});

describe("pedido → presupuesto → contratación → reseña", () => {
  it("recorre el flujo completo con reglas de integridad", async () => {
    const proA = await makePro({ verify: admin });
    const proB = await makePro({ verify: admin });
    const unverified = await makePro();
    const client = await makeClient();
    const stranger = await makeClient();

    await expect(createRequest(client, baseRequest([unverified.id]))).rejects.toThrow(/no está disponible/);
    await expect(createRequest(proA, baseRequest([proB.id]))).rejects.toThrow(/permiso/);

    const requestId = await createRequest(client, baseRequest([proA.id, proB.id]));
    await expect(getRequestDetail(stranger, requestId)).rejects.toThrow(/no encontrado/);

    const detailA = await getRequestDetail(proA, requestId);
    expect(detailA.quotes).toHaveLength(1); // no ve la cotización de la competencia
    const quoteA = detailA.quotes[0].quote.id;
    const quoteB = (await getRequestDetail(proB, requestId)).quotes[0].quote.id;

    await expect(respondQuote(client, quoteA, { price: 1000, durationText: "1 día", message: "mensaje de prueba" })).rejects.toThrow(/permiso/);
    await expect(respondQuote(proB, quoteA, { price: 1000, durationText: "1 día", message: "mensaje de prueba" })).rejects.toThrow(/no encontrado/);
    await respondQuote(proA, quoteA, { price: 30000, durationText: "2 horas", message: "Incluye materiales básicos." });
    await respondQuote(proB, quoteB, { price: 25000, durationText: "1 día", message: "Puedo ir el jueves a la tarde." });

    const forClient = await getRequestDetail(client, requestId);
    expect(forClient.status).toBe("presupuestado");
    expect(forClient.quotes).toHaveLength(2);

    await sendMessage(client, requestId, proA.id, { body: "¿Podés venir mañana?" });
    await expect(sendMessage(stranger, requestId, proA.id, { body: "hola" })).rejects.toThrow();

    await expect(hireQuote(stranger, quoteA)).rejects.toThrow(/no encontrado/);
    const jobId = await hireQuote(client, quoteA);
    await expect(hireQuote(client, quoteB)).rejects.toThrow();

    const hired = await getRequestDetail(client, requestId);
    expect(hired.status).toBe("contratado");
    expect(hired.quotes.find((q) => q.quote.id === quoteB)!.quote.status).toBe("descartada");

    await expect(createReview(client, jobId, { rating: 5, comment: "Excelente trabajo, muy prolijo." })).rejects.toThrow(/finalizado/);
    await expect(startJob(proB, jobId)).rejects.toThrow();
    await startJob(proA, jobId);
    await finishJob(proA, jobId);

    await expect(createReview(stranger, jobId, { rating: 1, comment: "Nunca lo contraté pero opino." })).rejects.toThrow(/no encontrado/);
    const res = await createReview(client, jobId, { rating: 5, comment: "Excelente trabajo, muy prolijo.", tags: ["Puntualidad"] });
    expect(res.flagged).toBe(false);
    await expect(createReview(client, jobId, { rating: 4, comment: "Segunda reseña del mismo trabajo." })).rejects.toThrow(/Ya calificaste/);

    const done = await getRequestDetail(client, requestId);
    expect(done.status).toBe("calificado");
    const profile = await getPublicProfile(proA.id);
    expect(profile!.reviewCount).toBe(1);
    expect(profile!.jobsDone).toBe(1);
  });

  it("las reseñas sospechosas quedan en revisión hasta que un admin las aprueba", async () => {
    expect(suspicionReason(5, "Llamalo al 341 155 1234567, es buenísimo")).toMatch(/teléfono/);
    expect(suspicionReason(1, "malo")).toMatch(/sin detalle/);
    expect(suspicionReason(5, "Excelente trabajo, puntual y prolijo.")).toBeNull();

    const pro = await makePro({ verify: admin });
    const client = await makeClient();
    const requestId = await createRequest(client, baseRequest([pro.id]));
    const quoteId = (await getRequestDetail(pro, requestId)).quotes[0].quote.id;
    await respondQuote(pro, quoteId, { price: 10000, durationText: "1 hora", message: "Mensaje de prueba." });
    const jobId = await hireQuote(client, quoteId);
    await finishJob(client, jobId);
    const res = await createReview(client, jobId, { rating: 5, comment: "Muy bueno, visiten www.ejemplo.com" });
    expect(res.flagged).toBe(true);
    expect((await getPublicProfile(pro.id))!.reviewCount).toBe(0);
    const [rev] = await db.select().from(schema.reviews).where(eq(schema.reviews.jobId, jobId));
    await expect(moderateReview(client, rev.id, "publicada")).rejects.toThrow(/permiso/);
    await moderateReview(admin, rev.id, "publicada");
    expect((await getPublicProfile(pro.id))!.reviewCount).toBe(1);
  });
});

describe("reclamos", () => {
  it("se abre y se resuelve de punta a punta", async () => {
    const pro = await makePro({ verify: admin });
    const client = await makeClient();
    const requestId = await createRequest(client, baseRequest([pro.id]));
    const quoteId = (await getRequestDetail(pro, requestId)).quotes[0].quote.id;
    await respondQuote(pro, quoteId, { price: 50000, durationText: "1 día", message: "Mensaje de prueba." });
    const jobId = await hireQuote(client, quoteId);

    const claim = { reason: "trabajo_mal_hecho" as const, description: "Quedaron manchas en el piso y no respondió." };
    await expect(openClaim(client, jobId, claim)).rejects.toThrow(/finalizado/);
    await finishJob(pro, jobId);
    await expect(openClaim(await makeClient(), jobId, claim)).rejects.toThrow(/no encontrado/);
    const claimId = await openClaim(client, jobId, claim);
    await expect(openClaim(client, jobId, claim)).rejects.toThrow(/en curso/);
    expect((await getRequestDetail(client, requestId)).status).toBe("en_reclamo");

    await expect(adminUpdateClaim(client, claimId, { status: "resuelto", note: "nota", resolution: "x".repeat(20) })).rejects.toThrow(/permiso/);
    await expect(adminUpdateClaim(admin, claimId, { status: "resuelto", note: "Salteando pasos", resolution: "x".repeat(20) })).rejects.toThrow(/No se puede pasar/);
    await adminUpdateClaim(admin, claimId, { status: "en_mediacion", note: "Contactamos a ambas partes." });
    await adminUpdateClaim(admin, claimId, { status: "en_mediacion", note: "Nota interna del equipo.", internal: true });
    await expect(adminUpdateClaim(admin, claimId, { status: "resuelto", note: "Listo" })).rejects.toThrow(/resolución/);
    await adminUpdateClaim(admin, claimId, { status: "resuelto", note: "Acuerdo alcanzado.", resolution: "El profesional vuelve a pintar sin costo." });

    const forClient = await getClaimForActor(client, claimId);
    expect(forClient.claim.status).toBe("resuelto");
    expect(forClient.events.some((e) => !e.visibleToClient)).toBe(false);
    expect(forClient.events.map((e) => e.status)).toEqual(["abierto", "en_mediacion", "resuelto"]);
    expect((await getClaimForActor(admin, claimId)).events).toHaveLength(4);
    await expect(getClaimForActor(await makeClient(), claimId)).rejects.toThrow(/no encontrado/);
    expect((await getRequestDetail(client, requestId)).status).toBe("finalizado");
  });
});

describe("control de acceso por rol", () => {
  it("sólo admins ven métricas", async () => {
    await expect(getMetrics(await makeClient())).rejects.toThrow(/permiso/);
    const m = await getMetrics(admin);
    expect(m.users.total).toBeGreaterThan(0);
  });
});
