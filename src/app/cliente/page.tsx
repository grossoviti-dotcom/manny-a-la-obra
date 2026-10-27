import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listClientRequests } from "@/lib/services/requests";
import { listClaims } from "@/lib/services/claims";
import { CLAIM_STATUS_LABEL, JOB_STATUS_LABEL, categoryName } from "@/lib/constants";
import { ButtonLink, EmptyState, StatusBadge, fmtDate } from "@/components/ui";
import { PanelNav } from "@/components/panel-nav";

export const metadata: Metadata = { title: "Mi panel", robots: { index: false } };

const NEXT_STEP: Record<string, string> = {
  solicitado: "Esperando presupuestos",
  presupuestado: "Compará y elegí",
  contratado: "Coordiná por el chat",
  en_curso: "Trabajo en curso",
  finalizado: "Dejá tu reseña",
  calificado: "Completado",
  en_reclamo: "Reclamo en curso",
  cancelado: "Cancelado",
};

export default async function ClientDashboard() {
  const user = await requireUser("cliente", "/cliente");
  const actor = { id: user.id, role: user.role };
  const [requests, claims] = await Promise.all([listClientRequests(actor), listClaims(actor)]);
  const active = requests.filter((r) => !["calificado", "cancelado"].includes(r.status));
  const past = requests.filter((r) => ["calificado", "cancelado"].includes(r.status));
  const toReview = requests.filter((r) => r.status === "finalizado" && !r.hasReview);

  const list = (rows: typeof requests) => (
    <ul className="space-y-3">
      {rows.map(({ request: r, status, quotesSent, quotesTotal, proName }) => (
        <li key={r.id}>
          <Link href={`/pedidos/${r.id}`} className="card flex flex-col gap-3 p-5 transition hover:border-ink sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{categoryName(r.categorySlug)} · {fmtDate(r.createdAt)}</p>
              <p className="mt-0.5 text-lg font-semibold">{r.title}</p>
              <p className="text-sm text-muted">
                {proName ? `Con ${proName}` : `${quotesSent} de ${quotesTotal} presupuestos recibidos`} · {NEXT_STEP[status]}
              </p>
            </div>
            <StatusBadge status={status} label={JOB_STATUS_LABEL[status]} />
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PanelNav title="Panel de cliente" user={user.name} items={[["#pedidos", "Mis pedidos"], ["#trabajos", "Mis trabajos"], ["#reclamos", "Mis reclamos"], ["/buscar", "Buscar profesional"]]} />
      <div className="container-page space-y-10 py-8">
        {toReview.length > 0 && (
          <div className="rounded-[18px] border-2 border-orange bg-orange/10 p-5">
            <p className="font-semibold">Tenés {toReview.length} trabajo(s) finalizado(s) para calificar.</p>
            <Link href={`/pedidos/${toReview[0].request.id}#calificar`} className="mt-1 inline-block font-semibold underline">Calificar ahora</Link>
          </div>
        )}
        <section id="pedidos" aria-labelledby="h-pedidos" className="scroll-mt-24">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h1 id="h-pedidos" className="text-2xl font-bold uppercase">Mis pedidos activos</h1>
            <ButtonLink href="/buscar" className="!min-h-10">+ Nuevo pedido</ButtonLink>
          </div>
          {active.length ? list(active) : <EmptyState title="No tenés pedidos activos">Buscá un profesional y pedí tu primer presupuesto.</EmptyState>}
        </section>
        <section id="trabajos" aria-labelledby="h-trabajos" className="scroll-mt-24">
          <h2 id="h-trabajos" className="mb-4 text-2xl font-bold uppercase">Mis trabajos anteriores</h2>
          {past.length ? list(past) : <EmptyState title="Todavía no hay trabajos terminados" />}
        </section>
        <section id="reclamos" aria-labelledby="h-reclamos" className="scroll-mt-24">
          <h2 id="h-reclamos" className="mb-4 text-2xl font-bold uppercase">Mis reclamos</h2>
          {claims.length ? (
            <ul className="space-y-3">
              {claims.map((c) => (
                <li key={c.claim.id}>
                  <Link href={`/reclamos/${c.claim.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-5 hover:border-ink">
                    <div>
                      <p className="font-semibold">{c.title}</p>
                      <p className="text-sm text-muted">Abierto el {fmtDate(c.claim.createdAt)}</p>
                    </div>
                    <StatusBadge status={c.claim.status} label={CLAIM_STATUS_LABEL[c.claim.status]} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No tenés reclamos">Si algún trabajo sale mal, podés abrir uno desde el pedido.</EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
