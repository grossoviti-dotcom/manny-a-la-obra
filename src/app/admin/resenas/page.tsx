import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { moderationQueue } from "@/lib/services/reviews";
import { moderateReviewAction } from "@/app/actions/admin";
import { EmptyState, StatusBadge, Stars, btn, cx, fmtDate } from "@/components/ui";

export const metadata: Metadata = { title: "Admin · Moderación de reseñas", robots: { index: false } };

const LABEL = { publicada: "Publicada", en_revision: "En revisión", oculta: "Oculta" } as const;

export default async function ReviewModeration() {
  const user = await requireUser("admin");
  const rows = await moderationQueue({ id: user.id, role: user.role });
  const flagged = rows.filter((r) => r.review.moderationStatus === "en_revision" || r.review.flagReason);
  const rest = rows.filter((r) => !flagged.includes(r)).slice(0, 30);
  const card = ({ review: r, clientName, proName }: (typeof rows)[number]) => (
    <li key={r.id} className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2"><Stars value={r.rating} /> <StatusBadge status={r.moderationStatus} label={LABEL[r.moderationStatus]} /></div>
        <span className="text-xs text-muted">{fmtDate(r.createdAt)}</span>
      </div>
      <p className="mt-2 text-sm"><strong>{clientName}</strong> sobre <strong>{proName}</strong></p>
      <p className="mt-1">{r.comment}</p>
      {r.flagReason && <p className="mt-2 text-sm font-semibold text-danger">Motivo de alerta: {r.flagReason}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {r.moderationStatus !== "publicada" || r.flagReason ? (
          <form action={moderateReviewAction}>
            <input type="hidden" name="reviewId" value={r.id} />
            <input type="hidden" name="decision" value="publicada" />
            <button className={cx(btn.primary, btn.sm)}>Aprobar y publicar</button>
          </form>
        ) : null}
        {r.moderationStatus !== "oculta" && (
          <form action={moderateReviewAction}>
            <input type="hidden" name="reviewId" value={r.id} />
            <input type="hidden" name="decision" value="oculta" />
            <button className={cx(btn.danger, btn.sm)}>Ocultar</button>
          </form>
        )}
      </div>
    </li>
  );
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold uppercase">Moderación de reseñas</h1>
      <section aria-label="Para revisar">
        <h2 className="mb-3 font-display text-lg font-semibold uppercase">Para revisar ({flagged.length})</h2>
        {flagged.length ? <ul className="grid gap-3 md:grid-cols-2">{flagged.map(card)}</ul> : <EmptyState title="No hay reseñas marcadas" />}
      </section>
      <section aria-label="Recientes">
        <h2 className="mb-3 font-display text-lg font-semibold uppercase">Recientes</h2>
        <ul className="grid gap-3 md:grid-cols-2">{rest.map(card)}</ul>
      </section>
    </div>
  );
}
