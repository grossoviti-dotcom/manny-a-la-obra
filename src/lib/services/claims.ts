import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { DomainError, assertRole, type Actor } from "@/lib/errors";
import { claimSchema } from "@/lib/validation";
import { CLAIM_STATUS_LABEL } from "@/lib/constants";
import { audit } from "@/lib/audit";
import { track } from "@/lib/analytics";
import { notify } from "@/lib/adapters/email";

type ClaimStatus = keyof typeof CLAIM_STATUS_LABEL;

// abierto → en mediación → resuelto | cerrado
const TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  abierto: ["en_mediacion", "cerrado"],
  en_mediacion: ["resuelto", "cerrado"],
  resuelto: [],
  cerrado: [],
};

export async function openClaim(actor: Actor, jobId: string, input: z.input<typeof claimSchema>, photoIds: string[] = []) {
  assertRole(actor, "cliente");
  const data = claimSchema.parse(input);
  const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, jobId));
  if (!job || job.clientId !== actor.id) throw new DomainError("Trabajo no encontrado.", "not_found");
  if (!job.finishedAt) throw new DomainError("Podés abrir un reclamo sobre un trabajo finalizado.");
  const open = await db
    .select({ id: schema.claims.id })
    .from(schema.claims)
    .where(and(eq(schema.claims.jobId, jobId), inArray(schema.claims.status, ["abierto", "en_mediacion"])));
  if (open.length) throw new DomainError("Ya tenés un reclamo en curso para este trabajo.", "conflict");

  const claimId = await db.transaction(async (tx) => {
    const [c] = await tx
      .insert(schema.claims)
      .values({ jobId, clientId: actor.id, professionalId: job.professionalId, reason: data.reason, description: data.description, photoIds })
      .returning({ id: schema.claims.id });
    await tx.insert(schema.claimEvents).values({
      claimId: c.id,
      actorId: actor.id,
      status: "abierto",
      note: "Reclamo iniciado por el cliente. El equipo de Manny a la Obra lo va a revisar en hasta 48 h hábiles.",
    });
    await tx.update(schema.jobs).set({ status: "en_reclamo" }).where(eq(schema.jobs.id, jobId));
    await audit(actor.id, "claim.open", "claim", c.id, { reason: data.reason }, tx);
    return c.id;
  });
  await track("claim_opened", { userId: actor.id, props: { reason: data.reason } });
  const [pro] = await db.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, job.professionalId));
  await notify(pro?.email, "Se abrió un reclamo sobre uno de tus trabajos", "Nuestro equipo te va a contactar para mediar.");
  return claimId;
}

export async function getClaimForActor(actor: Actor, claimId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(claimId)) throw new DomainError("Reclamo no encontrado.", "not_found");
  const [c] = await db.select().from(schema.claims).where(eq(schema.claims.id, claimId));
  if (!c) throw new DomainError("Reclamo no encontrado.", "not_found");
  const allowed = actor.role === "admin" || actor.id === c.clientId || actor.id === c.professionalId;
  if (!allowed) throw new DomainError("Reclamo no encontrado.", "not_found");
  const events = await db
    .select()
    .from(schema.claimEvents)
    .where(eq(schema.claimEvents.claimId, claimId))
    .orderBy(schema.claimEvents.createdAt);
  const [job] = await db
    .select({ job: schema.jobs, request: schema.serviceRequests })
    .from(schema.jobs)
    .innerJoin(schema.serviceRequests, eq(schema.serviceRequests.id, schema.jobs.requestId))
    .where(eq(schema.jobs.id, c.jobId));
  const names = await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, phone: schema.users.phone })
    .from(schema.users)
    .where(inArray(schema.users.id, [c.clientId, c.professionalId]));
  return {
    claim: c,
    events: actor.role === "admin" ? events : events.filter((e) => e.visibleToClient),
    job: job.job,
    request: job.request,
    client: names.find((n) => n.id === c.clientId)!,
    professional: names.find((n) => n.id === c.professionalId)!,
  };
}

export async function listClaims(actor: Actor) {
  const base = db
    .select({
      claim: schema.claims,
      title: schema.serviceRequests.title,
      clientName: schema.users.name,
    })
    .from(schema.claims)
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.claims.jobId))
    .innerJoin(schema.serviceRequests, eq(schema.serviceRequests.id, schema.jobs.requestId))
    .innerJoin(schema.users, eq(schema.users.id, schema.claims.clientId))
    .orderBy(desc(schema.claims.createdAt));
  if (actor.role === "admin") return base;
  if (actor.role === "cliente") return base.where(eq(schema.claims.clientId, actor.id));
  return base.where(eq(schema.claims.professionalId, actor.id));
}

export async function adminUpdateClaim(
  actor: Actor,
  claimId: string,
  input: { status: ClaimStatus; note: string; resolution?: string; internal?: boolean },
) {
  assertRole(actor, "admin");
  const note = input.note.trim();
  if (note.length < 5) throw new DomainError("Dejá una nota para el seguimiento (mín. 5 caracteres).");
  const [c] = await db.select().from(schema.claims).where(eq(schema.claims.id, claimId));
  if (!c) throw new DomainError("Reclamo no encontrado.", "not_found");
  const sameStatus = input.status === c.status;
  if (!sameStatus && !TRANSITIONS[c.status].includes(input.status))
    throw new DomainError(`No se puede pasar de "${CLAIM_STATUS_LABEL[c.status]}" a "${CLAIM_STATUS_LABEL[input.status]}".`);
  if (sameStatus && (c.status === "resuelto" || c.status === "cerrado")) throw new DomainError("El reclamo ya está cerrado.");
  const closing = input.status === "resuelto" || input.status === "cerrado";
  if (closing && (!input.resolution || input.resolution.trim().length < 10))
    throw new DomainError("Registrá la resolución (mín. 10 caracteres).");

  await db.transaction(async (tx) => {
    await tx
      .update(schema.claims)
      .set({
        status: input.status,
        resolution: closing ? input.resolution!.trim() : c.resolution,
        resolvedAt: closing ? new Date() : c.resolvedAt,
      })
      .where(eq(schema.claims.id, claimId));
    await tx.insert(schema.claimEvents).values({
      claimId,
      actorId: actor.id,
      status: input.status,
      note,
      visibleToClient: !input.internal,
    });
    if (closing) {
      const [rev] = await tx.select({ id: schema.reviews.id }).from(schema.reviews).where(eq(schema.reviews.jobId, c.jobId));
      await tx.update(schema.jobs).set({ status: rev ? "calificado" : "finalizado" }).where(eq(schema.jobs.id, c.jobId));
    }
    await audit(actor.id, "claim.update", "claim", claimId, { from: c.status, to: input.status }, tx);
  });

  if (closing) {
    const hours = (Date.now() - c.createdAt.getTime()) / 36e5;
    await track("claim_resolved", { userId: actor.id, props: { claimId, status: input.status, hours: Math.round(hours) } });
  }
  if (!input.internal) {
    const [client] = await db.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, c.clientId));
    await notify(client?.email, `Tu reclamo está ${CLAIM_STATUS_LABEL[input.status].toLowerCase()}`, note);
  }
}
