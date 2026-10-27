import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { DomainError, assertRole, type Actor } from "@/lib/errors";
import { messageSchema, quoteSchema, requestSchema } from "@/lib/validation";
import type { FlowStatus } from "@/lib/constants";
import { audit } from "@/lib/audit";
import { track } from "@/lib/analytics";
import { notify } from "@/lib/adapters/email";
import { visibleProfessional } from "./search";

const r = schema.serviceRequests;
const q = schema.quotes;
const j = schema.jobs;

/** Estado del flujo: solicitado → presupuestado → contratado → en curso → finalizado → calificado | en reclamo. */
export function flowStatus(request: { status: string }, job?: { status: string } | null): FlowStatus {
  if (request.status === "cancelado") return "cancelado";
  if (job) return job.status as FlowStatus;
  return request.status as FlowStatus;
}

async function emailOf(userId: string) {
  const [u] = await db.select({ email: schema.users.email, name: schema.users.name }).from(schema.users).where(eq(schema.users.id, userId));
  return u;
}

export async function createRequest(actor: Actor, input: z.input<typeof requestSchema>, photoIds: string[] = [], anonId?: string) {
  assertRole(actor, "cliente");
  const data = requestSchema.parse(input);
  const proIds = [...new Set(data.professionalIds)];

  // Sólo se puede pedir presupuesto a profesionales visibles (verificados y vigentes).
  const visible = await db
    .select({ id: schema.professionalProfiles.userId })
    .from(schema.professionalProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.professionalProfiles.userId))
    .where(and(inArray(schema.professionalProfiles.userId, proIds), visibleProfessional()));
  if (visible.length !== proIds.length) throw new DomainError("Alguno de los profesionales elegidos no está disponible.");

  const requestId = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(r)
      .values({
        clientId: actor.id,
        categorySlug: data.categorySlug,
        title: data.title,
        description: data.description,
        zone: data.zone,
        urgency: data.urgency,
        desiredDate: data.desiredDate,
        photoIds,
      })
      .returning({ id: r.id });
    await tx.insert(q).values(proIds.map((professionalId) => ({ requestId: row.id, professionalId })));
    await audit(actor.id, "request.create", "service_request", row.id, { pros: proIds.length }, tx);
    return row.id;
  });

  await track("quote_request_created", { userId: actor.id, anonId, props: { category: data.categorySlug, pros: proIds.length } });
  for (const id of proIds) {
    const pro = await emailOf(id);
    await notify(pro?.email, `Nuevo pedido de presupuesto: ${data.title}`, `Zona: ${data.zone}. Respondé desde tu panel.`);
  }
  return requestId;
}

export async function respondQuote(actor: Actor, quoteId: string, input: z.input<typeof quoteSchema>) {
  assertRole(actor, "profesional");
  const data = quoteSchema.parse(input);
  const [quote] = await db.select().from(q).where(eq(q.id, quoteId));
  if (!quote || quote.professionalId !== actor.id) throw new DomainError("Pedido no encontrado.", "not_found");
  if (!["solicitada", "enviada"].includes(quote.status)) throw new DomainError("Este pedido ya no admite presupuestos.");
  const [req] = await db.select().from(r).where(eq(r.id, quote.requestId));
  if (req.status === "contratado" || req.status === "cancelado") throw new DomainError("El cliente ya cerró este pedido.");

  await db.transaction(async (tx) => {
    await tx
      .update(q)
      .set({ ...data, status: "enviada", respondedAt: new Date() })
      .where(eq(q.id, quoteId));
    if (req.status === "solicitado") await tx.update(r).set({ status: "presupuestado" }).where(eq(r.id, req.id));
    await audit(actor.id, "quote.send", "quote", quoteId, { price: data.price }, tx);
  });
  await track("quote_sent", { userId: actor.id, props: { requestId: req.id } });
  const client = await emailOf(req.clientId);
  await notify(client?.email, `Recibiste un presupuesto para "${req.title}"`, "Entrá a Manny a la Obra para compararlo.");
}

export async function declineQuote(actor: Actor, quoteId: string) {
  assertRole(actor, "profesional");
  const [quote] = await db.select().from(q).where(eq(q.id, quoteId));
  if (!quote || quote.professionalId !== actor.id) throw new DomainError("Pedido no encontrado.", "not_found");
  if (quote.status !== "solicitada") throw new DomainError("Ya respondiste este pedido.");
  await db.update(q).set({ status: "rechazada", respondedAt: new Date() }).where(eq(q.id, quoteId));
  await audit(actor.id, "quote.decline", "quote", quoteId);
}

/** El cliente elige un presupuesto: se crea el trabajo y se descartan los demás. */
export async function hireQuote(actor: Actor, quoteId: string) {
  assertRole(actor, "cliente");
  const [quote] = await db.select().from(q).where(eq(q.id, quoteId));
  if (!quote) throw new DomainError("Presupuesto no encontrado.", "not_found");
  const [req] = await db.select().from(r).where(eq(r.id, quote.requestId));
  if (!req || req.clientId !== actor.id) throw new DomainError("Presupuesto no encontrado.", "not_found");
  if (quote.status !== "enviada") throw new DomainError("Sólo podés contratar un presupuesto enviado.");
  if (req.status === "contratado" || req.status === "cancelado") throw new DomainError("Este pedido ya está cerrado.");

  const jobId = await db.transaction(async (tx) => {
    await tx.update(q).set({ status: "aceptada" }).where(eq(q.id, quoteId));
    await tx
      .update(q)
      .set({ status: "descartada" })
      .where(and(eq(q.requestId, req.id), ne(q.id, quoteId), inArray(q.status, ["solicitada", "enviada"])));
    await tx.update(r).set({ status: "contratado" }).where(eq(r.id, req.id));
    const [job] = await tx
      .insert(j)
      .values({ requestId: req.id, quoteId, clientId: actor.id, professionalId: quote.professionalId })
      .returning({ id: j.id });
    await audit(actor.id, "job.hire", "job", job.id, { quoteId, price: quote.price }, tx);
    return job.id;
  });

  const hoursToHire = (Date.now() - req.createdAt.getTime()) / 36e5;
  await track("job_hired", { userId: actor.id, props: { requestId: req.id, hoursToHire: Math.round(hoursToHire * 10) / 10 } });
  const pro = await emailOf(quote.professionalId);
  await notify(pro?.email, `¡Te contrataron para "${req.title}"!`, "Coordiná con el cliente por el chat del pedido.");
  return jobId;
}

async function getJobFor(actor: Actor, jobId: string) {
  const [job] = await db.select().from(j).where(eq(j.id, jobId));
  if (!job) throw new DomainError("Trabajo no encontrado.", "not_found");
  if (actor.role !== "admin" && job.clientId !== actor.id && job.professionalId !== actor.id)
    throw new DomainError("Trabajo no encontrado.", "not_found");
  return job;
}

export async function startJob(actor: Actor, jobId: string) {
  assertRole(actor, "profesional");
  const job = await getJobFor(actor, jobId);
  if (job.professionalId !== actor.id) throw new DomainError("No tenés permiso para hacer esto.", "forbidden");
  if (job.status !== "contratado") throw new DomainError("El trabajo no está en estado contratado.");
  await db.update(j).set({ status: "en_curso", startedAt: new Date() }).where(eq(j.id, jobId));
  await audit(actor.id, "job.start", "job", jobId);
}

/** Lo puede marcar el profesional o el cliente. */
export async function finishJob(actor: Actor, jobId: string) {
  assertRole(actor, "profesional", "cliente");
  const job = await getJobFor(actor, jobId);
  if (job.status !== "en_curso" && job.status !== "contratado") throw new DomainError("El trabajo no está en curso.");
  const now = new Date();
  await db
    .update(j)
    .set({ status: "finalizado", finishedAt: now, startedAt: job.startedAt ?? now })
    .where(eq(j.id, jobId));
  await audit(actor.id, "job.finish", "job", jobId);
  await track("job_finished", { userId: actor.id, props: { jobId } });
  const client = await emailOf(job.clientId);
  await notify(client?.email, "Tu trabajo fue marcado como finalizado", "Contanos cómo te fue: tu reseña ayuda a otras personas a decidir.");
}

export async function cancelRequest(actor: Actor, requestId: string) {
  assertRole(actor, "cliente");
  const [req] = await db.select().from(r).where(eq(r.id, requestId));
  if (!req || req.clientId !== actor.id) throw new DomainError("Pedido no encontrado.", "not_found");
  if (req.status === "contratado" || req.status === "cancelado") throw new DomainError("Este pedido no se puede cancelar.");
  await db.transaction(async (tx) => {
    await tx.update(r).set({ status: "cancelado" }).where(eq(r.id, requestId));
    await tx.update(q).set({ status: "descartada" }).where(and(eq(q.requestId, requestId), inArray(q.status, ["solicitada", "enviada"])));
  });
  await audit(actor.id, "request.cancel", "service_request", requestId);
}

/** Verifica que el actor participe del hilo (pedido + profesional). */
async function assertThreadAccess(actor: Actor, requestId: string, professionalId: string) {
  const [row] = await db
    .select({ clientId: r.clientId, quoteStatus: q.status })
    .from(r)
    .innerJoin(q, and(eq(q.requestId, r.id), eq(q.professionalId, professionalId)))
    .where(eq(r.id, requestId));
  if (!row) throw new DomainError("Conversación no encontrada.", "not_found");
  const allowed = actor.role === "admin" || actor.id === row.clientId || actor.id === professionalId;
  if (!allowed) throw new DomainError("Conversación no encontrada.", "not_found");
  return row;
}

export async function sendMessage(actor: Actor, requestId: string, professionalId: string, input: z.input<typeof messageSchema>) {
  assertRole(actor, "cliente", "profesional");
  const { body } = messageSchema.parse(input);
  const thread = await assertThreadAccess(actor, requestId, professionalId);
  if (thread.quoteStatus === "rechazada" || thread.quoteStatus === "descartada")
    throw new DomainError("Esta conversación está cerrada.");
  await db.insert(schema.messages).values({ requestId, professionalId, senderId: actor.id, body });
  const otherId = actor.id === professionalId ? thread.clientId : professionalId;
  const other = await emailOf(otherId);
  await notify(other?.email, "Tenés un mensaje nuevo en Manny a la Obra", body.slice(0, 140));
}

export async function getThread(actor: Actor, requestId: string, professionalId: string) {
  await assertThreadAccess(actor, requestId, professionalId);
  return db
    .select({
      id: schema.messages.id,
      body: schema.messages.body,
      senderId: schema.messages.senderId,
      createdAt: schema.messages.createdAt,
    })
    .from(schema.messages)
    .where(and(eq(schema.messages.requestId, requestId), eq(schema.messages.professionalId, professionalId)))
    .orderBy(schema.messages.createdAt);
}

const ratingAvg = sql<number | null>`(select round(avg(rv.rating)::numeric, 1)::float from reviews rv where rv.professional_id = ${q.professionalId} and rv.moderation_status = 'publicada')`;
const jobsDone = sql<number>`(select count(*)::int from jobs jj where jj.professional_id = ${q.professionalId} and jj.finished_at is not null)`;

/** Detalle de un pedido para el cliente dueño, un profesional invitado o un admin. */
export async function getRequestDetail(actor: Actor, requestId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) throw new DomainError("Pedido no encontrado.", "not_found");
  const [req] = await db
    .select({ request: r, clientName: schema.users.name })
    .from(r)
    .innerJoin(schema.users, eq(schema.users.id, r.clientId))
    .where(eq(r.id, requestId));
  if (!req) throw new DomainError("Pedido no encontrado.", "not_found");

  const isClient = req.request.clientId === actor.id;
  let quoteRows = await db
    .select({
      quote: q,
      proName: schema.users.name,
      tradeTitle: schema.professionalProfiles.tradeTitle,
      yearsExperience: schema.professionalProfiles.yearsExperience,
      verificationStatus: schema.professionalProfiles.verificationStatus,
      verifiedAt: schema.professionalProfiles.verifiedAt,
      availability: schema.professionalProfiles.availability,
      plan: schema.professionalProfiles.plan,
      rating: ratingAvg,
      jobsDone,
    })
    .from(q)
    .innerJoin(schema.users, eq(schema.users.id, q.professionalId))
    .innerJoin(schema.professionalProfiles, eq(schema.professionalProfiles.userId, q.professionalId))
    .where(eq(q.requestId, requestId))
    .orderBy(q.createdAt);

  const ownQuote = quoteRows.find((x) => x.quote.professionalId === actor.id);
  if (actor.role !== "admin" && !isClient && !ownQuote) throw new DomainError("Pedido no encontrado.", "not_found");
  // Un profesional sólo ve su propia cotización, nunca las de la competencia.
  if (actor.role === "profesional") quoteRows = quoteRows.filter((x) => x.quote.professionalId === actor.id);

  const [job] = await db.select().from(j).where(eq(j.requestId, requestId));
  const [review] = job ? await db.select().from(schema.reviews).where(eq(schema.reviews.jobId, job.id)) : [];
  const claimRows = job ? await db.select().from(schema.claims).where(eq(schema.claims.jobId, job.id)).orderBy(desc(schema.claims.createdAt)) : [];

  return {
    request: req.request,
    clientName: req.clientName,
    quotes: quoteRows,
    job: job ?? null,
    review: review ?? null,
    claims: claimRows,
    status: flowStatus(req.request, job),
    viewer: isClient ? ("cliente" as const) : actor.role === "admin" ? ("admin" as const) : ("profesional" as const),
  };
}

export async function listClientRequests(actor: Actor) {
  assertRole(actor, "cliente");
  const rows = await db
    .select({
      request: r,
      job: j,
      quotesSent: sql<number>`(select count(*)::int from quotes x where x.request_id = ${r.id} and x.status in ('enviada','aceptada'))`,
      quotesTotal: sql<number>`(select count(*)::int from quotes x where x.request_id = ${r.id})`,
      proName: sql<string | null>`(select name from users where id = ${j.professionalId})`,
      hasReview: sql<boolean>`exists (select 1 from reviews rv where rv.job_id = ${j.id})`,
    })
    .from(r)
    .leftJoin(j, eq(j.requestId, r.id))
    .where(eq(r.clientId, actor.id))
    .orderBy(desc(r.createdAt));
  return rows.map((x) => ({ ...x, status: flowStatus(x.request, x.job) }));
}

export async function listProfessionalInbox(actor: Actor) {
  assertRole(actor, "profesional");
  const rows = await db
    .select({ quote: q, request: r, job: j, clientName: schema.users.name })
    .from(q)
    .innerJoin(r, eq(r.id, q.requestId))
    .innerJoin(schema.users, eq(schema.users.id, r.clientId))
    .leftJoin(j, and(eq(j.requestId, r.id), eq(j.professionalId, actor.id)))
    .where(eq(q.professionalId, actor.id))
    .orderBy(desc(r.createdAt));
  return rows.map((x) => ({ ...x, status: x.job ? flowStatus(x.request, x.job) : (x.quote.status as string) }));
}
