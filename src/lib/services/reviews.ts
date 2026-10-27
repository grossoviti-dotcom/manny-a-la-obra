import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { DomainError, assertRole, type Actor } from "@/lib/errors";
import { reviewSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { track } from "@/lib/analytics";
import { notify } from "@/lib/adapters/email";

/** Heurística simple de reseñas sospechosas: se publican recién después de que un admin las revise. */
export function suspicionReason(rating: number, comment: string): string | null {
  const text = comment.toLowerCase();
  if (/(https?:\/\/|www\.)/.test(text)) return "Contiene enlaces";
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text)) return "Contiene un email";
  if (/(\+?54)?\s?9?\s?(341|11)\s?\d{3}[\s-]?\d{4}/.test(text) || /\d{8,}/.test(text.replace(/[\s-]/g, "")))
    return "Contiene un teléfono";
  if (/(estafa|chorro|ladr[oó]n|hdp|pelotud|forro)/.test(text)) return "Lenguaje ofensivo o acusación grave";
  if (rating === 1 && comment.trim().length < 25) return "Calificación mínima sin detalle";
  return null;
}

export async function createReview(actor: Actor, jobId: string, input: z.input<typeof reviewSchema>) {
  assertRole(actor, "cliente");
  const data = reviewSchema.parse(input);
  const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, jobId));
  // Sólo el cliente que contrató, y sólo con el trabajo finalizado en la plataforma.
  if (!job || job.clientId !== actor.id) throw new DomainError("Trabajo no encontrado.", "not_found");
  if (!job.finishedAt) throw new DomainError("Podés calificar cuando el trabajo esté finalizado.");
  const [existing] = await db.select({ id: schema.reviews.id }).from(schema.reviews).where(eq(schema.reviews.jobId, jobId));
  if (existing) throw new DomainError("Ya calificaste este trabajo.", "conflict");

  const flag = suspicionReason(data.rating, data.comment);
  await db.transaction(async (tx) => {
    const [rev] = await tx
      .insert(schema.reviews)
      .values({
        jobId,
        clientId: actor.id,
        professionalId: job.professionalId,
        rating: data.rating,
        comment: data.comment,
        tags: data.tags,
        moderationStatus: flag ? "en_revision" : "publicada",
        flagReason: flag,
      })
      .returning({ id: schema.reviews.id });
    if (job.status === "finalizado") await tx.update(schema.jobs).set({ status: "calificado" }).where(eq(schema.jobs.id, jobId));
    await audit(actor.id, "review.create", "review", rev.id, { rating: data.rating, flagged: !!flag }, tx);
  });
  await track("review_created", { userId: actor.id, props: { rating: data.rating, flagged: !!flag } });
  const [pro] = await db.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, job.professionalId));
  if (!flag) await notify(pro?.email, "Recibiste una reseña nueva", `Te calificaron con ${data.rating} estrella(s).`);
  return { flagged: !!flag };
}

export async function reportReview(actor: Actor, reviewId: string, reason: string) {
  assertRole(actor, "profesional");
  const [rev] = await db.select().from(schema.reviews).where(eq(schema.reviews.id, reviewId));
  if (!rev || rev.professionalId !== actor.id) throw new DomainError("Reseña no encontrada.", "not_found");
  if (rev.moderationStatus !== "publicada") throw new DomainError("Esta reseña ya está en revisión.");
  const why = reason.trim().slice(0, 300);
  if (why.length < 10) throw new DomainError("Explicá brevemente el motivo (mín. 10 caracteres).");
  // La reseña sigue publicada mientras se revisa: denunciar no la oculta automáticamente.
  await db.update(schema.reviews).set({ flagReason: `Denunciada por el profesional: ${why}` }).where(eq(schema.reviews.id, reviewId));
  await audit(actor.id, "review.report", "review", reviewId, { reason: why });
}

export async function moderationQueue(actor: Actor) {
  assertRole(actor, "admin");
  return db
    .select({
      review: schema.reviews,
      clientName: schema.users.name,
      proName: sql<string>`(select name from users where id = ${schema.reviews.professionalId})`,
    })
    .from(schema.reviews)
    .innerJoin(schema.users, eq(schema.users.id, schema.reviews.clientId))
    .orderBy(
      sql`(${schema.reviews.moderationStatus} = 'en_revision' or ${schema.reviews.flagReason} is not null) desc`,
      desc(schema.reviews.createdAt),
    )
    .limit(200);
}

export async function moderateReview(actor: Actor, reviewId: string, decision: "publicada" | "oculta", note?: string) {
  assertRole(actor, "admin");
  const [rev] = await db.select().from(schema.reviews).where(eq(schema.reviews.id, reviewId));
  if (!rev) throw new DomainError("Reseña no encontrada.", "not_found");
  await db
    .update(schema.reviews)
    .set({ moderationStatus: decision, flagReason: decision === "publicada" ? null : rev.flagReason })
    .where(eq(schema.reviews.id, reviewId));
  await audit(actor.id, `review.${decision === "publicada" ? "approve" : "hide"}`, "review", reviewId, { note });
}
