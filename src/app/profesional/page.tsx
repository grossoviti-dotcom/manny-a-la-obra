import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth/session";
import { getOwnProfile } from "@/lib/services/verification";
import { listProfessionalInbox } from "@/lib/services/requests";
import { JOB_STATUS_LABEL, PLANS, QUOTE_STATUS_LABEL, URGENCY_LABEL, VERIFICATION_LABEL, categoryName } from "@/lib/constants";
import { ButtonLink, Chip, EmptyState, Notice, StatusBadge, Stars, fmtDate, money } from "@/components/ui";
import { ReportReviewForm } from "./report-review-form";

export const metadata: Metadata = { title: "Panel profesional", robots: { index: false } };

export default async function ProDashboard() {
  const user = await requireUser("profesional");
  const actor = { id: user.id, role: user.role };
  const [p, inbox, reviews] = await Promise.all([
    getOwnProfile(actor),
    listProfessionalInbox(actor),
    db
      .select({ review: schema.reviews, clientName: schema.users.name })
      .from(schema.reviews)
      .innerJoin(schema.users, eq(schema.users.id, schema.reviews.clientId))
      .where(eq(schema.reviews.professionalId, user.id))
      .orderBy(desc(schema.reviews.createdAt))
      .limit(20),
  ]);
  const [stats] = (
    await db.execute(sql`select
      (select round(avg(rating)::numeric,1)::float from reviews where professional_id = ${user.id} and moderation_status='publicada') rating,
      (select count(*)::int from jobs where professional_id = ${user.id} and finished_at is not null) done,
      (select count(*)::int from quotes where professional_id = ${user.id}) received,
      (select count(*)::int from jobs where professional_id = ${user.id}) hired`)
  ).rows as { rating: number | null; done: number; received: number; hired: number }[];

  const pending = inbox.filter((i) => i.quote.status === "solicitada" && ["solicitado", "presupuestado"].includes(i.request.status));
  const activeJobs = inbox.filter((i) => i.job && ["contratado", "en_curso", "en_reclamo"].includes(i.job.status));
  const others = inbox.filter((i) => !pending.includes(i) && !activeJobs.includes(i));

  const row = (i: (typeof inbox)[number]) => (
    <li key={i.quote.id}>
      <Link href={`/pedidos/${i.request.id}`} className="card flex flex-col gap-2 p-4 hover:border-ink sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{categoryName(i.request.categorySlug)} · {i.request.zone} · {fmtDate(i.request.createdAt)}</p>
          <p className="font-semibold">{i.request.title}</p>
          <p className="text-sm text-muted">{i.clientName} · {URGENCY_LABEL[i.request.urgency]}{i.quote.price ? ` · Tu presupuesto: ${money(i.quote.price)}` : ""}</p>
        </div>
        {i.job ? (
          <StatusBadge status={i.job.status} label={JOB_STATUS_LABEL[i.job.status]} />
        ) : (
          <StatusBadge status={i.quote.status} label={QUOTE_STATUS_LABEL[i.quote.status]} />
        )}
      </Link>
    </li>
  );

  return (
    <div className="space-y-10">
      {p.verificationStatus !== "verificado" && (
        <Notice tone={p.verificationStatus === "rechazado" ? "error" : "warn"}>
          <strong>Estado de verificación: {VERIFICATION_LABEL[p.verificationStatus]}.</strong>{" "}
          {p.verificationStatus === "en_revision" ? "Te avisamos por email cuando terminemos." : "Tu perfil no aparece en las búsquedas hasta que te verifiquemos."}{" "}
          <Link href="/profesional/verificacion" className="font-semibold underline">Ir a verificación</Link>
        </Notice>
      )}
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Calificación", stats.rating?.toLocaleString("es-AR") ?? "—"],
          ["Trabajos finalizados", stats.done],
          ["Pedidos recibidos", stats.received],
          ["Tasa de contratación", stats.received ? `${Math.round((stats.hired / stats.received) * 100)}%` : "—"],
        ].map(([l, v]) => (
          <div key={l as string} className="card p-5">
            <dt className="text-sm text-muted">{l}</dt>
            <dd className="font-display text-3xl font-bold">{v}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="h-pend">
        <h1 id="h-pend" className="mb-3 text-2xl font-bold uppercase">Pedidos para responder ({pending.length})</h1>
        {pending.length ? <ul className="space-y-3">{pending.map(row)}</ul> : <EmptyState title="Estás al día">Cuando un cliente te pida presupuesto, aparece acá y te llega un email.</EmptyState>}
      </section>
      <section aria-labelledby="h-jobs">
        <h2 id="h-jobs" className="mb-3 text-2xl font-bold uppercase">Trabajos en curso ({activeJobs.length})</h2>
        {activeJobs.length ? <ul className="space-y-3">{activeJobs.map(row)}</ul> : <EmptyState title="Sin trabajos en curso" />}
      </section>
      {others.length > 0 && (
        <section aria-labelledby="h-hist">
          <details>
            <summary className="cursor-pointer text-2xl font-bold uppercase" id="h-hist">Historial ({others.length})</summary>
            <ul className="mt-3 space-y-3">{others.map(row)}</ul>
          </details>
        </section>
      )}

      <section id="resenas" aria-labelledby="h-rev" className="scroll-mt-24">
        <h2 id="h-rev" className="mb-3 text-2xl font-bold uppercase">Reseñas recibidas ({reviews.length})</h2>
        {reviews.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {reviews.map(({ review: r, clientName }) => (
              <li key={r.id} className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <Stars value={r.rating} />
                  <span className="text-xs text-muted">{fmtDate(r.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm font-semibold">{clientName}</p>
                <p className="mt-1 text-sm">{r.comment}</p>
                <div className="mt-2 flex flex-wrap gap-1">{r.tags.map((t) => <Chip key={t} className="!py-0 text-xs">{t}</Chip>)}</div>
                {r.moderationStatus !== "publicada" && <p className="mt-2"><StatusBadge status={r.moderationStatus} label={r.moderationStatus === "en_revision" ? "En revisión" : "Oculta"} /></p>}
                {r.flagReason?.startsWith("Denunciada") ? <p className="mt-2 text-xs text-muted">Denuncia enviada: en revisión por el equipo.</p> : r.moderationStatus === "publicada" && <ReportReviewForm reviewId={r.id} />}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Todavía no tenés reseñas" />
        )}
      </section>

      <section id="plan" aria-labelledby="h-plan" className="scroll-mt-24">
        <h2 id="h-plan" className="mb-3 text-2xl font-bold uppercase">Mi plan</h2>
        <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl font-bold uppercase">{PLANS[p.plan].name} <span className="text-orange-deep">{PLANS[p.plan].price}</span></p>
            <p className="text-sm text-muted">{PLANS[p.plan].detail}</p>
          </div>
          {p.plan === "gratis" && <ButtonLink href="/ayuda#contacto" variant="secondary">Quiero Premium</ButtonLink>}
        </div>
      </section>
    </div>
  );
}
