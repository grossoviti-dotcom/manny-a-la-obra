import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getClaimForActor } from "@/lib/services/claims";
import { DomainError } from "@/lib/errors";
import { CLAIM_REASON_LABEL, CLAIM_STATUS_LABEL } from "@/lib/constants";
import { Notice, StatusBadge, fmtDate, fmtDateTime } from "@/components/ui";
import { AdminClaimForm } from "./admin-claim-form";

export const metadata: Metadata = { title: "Seguimiento del reclamo", robots: { index: false } };

export default async function ClaimPage(props: PageProps<"/reclamos/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const user = await requireUser(undefined, `/reclamos/${id}`);
  let d: Awaited<ReturnType<typeof getClaimForActor>>;
  try {
    d = await getClaimForActor({ id: user.id, role: user.role }, id);
  } catch (e) {
    if (e instanceof DomainError) notFound();
    throw e;
  }
  const { claim: c, events, request, client, professional } = d;
  const isAdmin = user.role === "admin";
  return (
    <div className="container-page max-w-4xl py-10">
      <nav className="mb-4 text-sm">
        <Link href={isAdmin ? "/admin/reclamos" : `/pedidos/${request.id}`} className="underline">← {isAdmin ? "Cola de reclamos" : "Volver al pedido"}</Link>
      </nav>
      {sp.nuevo === "1" && <div className="mb-6"><Notice tone="success">Recibimos tu reclamo. Te contactamos en hasta 48 h hábiles.</Notice></div>}
      <header className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">Reclamo · {fmtDate(c.createdAt)}</p>
            <h1 className="mt-1 text-2xl font-bold uppercase">{request.title}</h1>
          </div>
          <StatusBadge status={c.status} label={CLAIM_STATUS_LABEL[c.status]} />
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-muted">Motivo</dt><dd className="font-semibold">{CLAIM_REASON_LABEL[c.reason]}</dd></div>
          <div><dt className="text-muted">Cliente</dt><dd className="font-semibold">{client.name}{isAdmin && <span className="block font-normal text-muted">{client.email} · {client.phone ?? "sin teléfono"}</span>}</dd></div>
          <div><dt className="text-muted">Profesional</dt><dd className="font-semibold">{professional.name}{isAdmin && <span className="block font-normal text-muted">{professional.email} · {professional.phone ?? "sin teléfono"}</span>}</dd></div>
        </dl>
        <p className="mt-4 whitespace-pre-line border-t border-border pt-4">{c.description}</p>
        {c.photoIds.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {c.photoIds.map((f, i) => (
              <li key={f}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <a href={`/api/archivos/${f}`} target="_blank" rel="noreferrer"><img src={`/api/archivos/${f}`} alt={`Foto ${i + 1} del reclamo`} className="size-24 rounded-xl object-cover ring-1 ring-border" /></a>
              </li>
            ))}
          </ul>
        )}
        {c.resolution && (
          <div className="mt-4 rounded-xl bg-success/10 p-4 ring-1 ring-success/30">
            <p className="text-sm font-semibold uppercase text-success">Resolución</p>
            <p className="mt-1">{c.resolution}</p>
          </div>
        )}
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <section className="card p-6" aria-labelledby="seguimiento">
          <h2 id="seguimiento" className="text-xl font-bold uppercase">Seguimiento</h2>
          <ol className="mt-4 space-y-4 border-l-2 border-border pl-5">
            {events.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[27px] top-1 size-3 rounded-full bg-orange ring-4 ring-white" aria-hidden />
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={e.status} label={CLAIM_STATUS_LABEL[e.status]} />
                  <span className="text-xs text-muted">{fmtDateTime(e.createdAt)}</span>
                  {!e.visibleToClient && <span className="text-xs font-semibold text-orange-deep">Nota interna</span>}
                </div>
                <p className="mt-1 text-sm">{e.note}</p>
              </li>
            ))}
          </ol>
        </section>
        {isAdmin ? (
          <section className="card p-6" aria-labelledby="gestion">
            <h2 id="gestion" className="text-xl font-bold uppercase">Gestionar</h2>
            <div className="mt-4"><AdminClaimForm claimId={c.id} status={c.status} /></div>
          </section>
        ) : (
          <aside className="card-alt h-fit p-6 text-sm">
            <h2 className="font-display text-lg font-semibold uppercase">¿Qué sigue?</h2>
            <p className="mt-2 text-muted">El equipo revisa el presupuesto, el chat y las fotos, y contacta a ambas partes. Cada avance aparece en el seguimiento y te llega por email.</p>
            <Link href="/legal/reclamos" className="mt-3 inline-block font-semibold underline">Política de reclamos</Link>
          </aside>
        )}
      </div>
    </div>
  );
}
