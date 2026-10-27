import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getRequestDetail, getThread } from "@/lib/services/requests";
import { DomainError } from "@/lib/errors";
import { AVAILABILITY_LABEL, CLAIM_STATUS_LABEL, JOB_STATUS_LABEL, QUOTE_STATUS_LABEL, URGENCY_LABEL, categoryName, type FlowStatus } from "@/lib/constants";
import { Avatar, Chip, Notice, StatusBadge, Stars, VerifiedBadge, cx, fmtDate, fmtDateTime, money } from "@/components/ui";
import { IconChat, IconShieldCheck } from "@/components/icons";
import { AutoRefresh, CancelRequestButton, ClaimForm, Collapsible, HireButton, JobButton, MessageForm, QuoteForm, ReviewForm } from "./forms";
import { declineQuoteAction } from "@/app/actions/flow";

export const metadata: Metadata = { title: "Detalle del pedido", robots: { index: false } };

const STEPS: FlowStatus[] = ["solicitado", "presupuestado", "contratado", "en_curso", "finalizado", "calificado"];

function Progress({ status }: { status: FlowStatus }) {
  const idx = status === "en_reclamo" ? 4 : STEPS.indexOf(status);
  return (
    <ol className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Progreso del pedido">
      {STEPS.map((s, i) => {
        const done = i <= idx && status !== "cancelado";
        return (
          <li key={s} className="text-xs" aria-current={i === idx ? "step" : undefined}>
            <span className={cx("block h-1.5 rounded-full", done ? "bg-orange" : "bg-border")} />
            <span className={cx("mt-1 block font-semibold uppercase tracking-wide", done ? "text-ink" : "text-muted")}>
              {done && <span className="sr-only">Completado: </span>}
              {JOB_STATUS_LABEL[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default async function RequestDetailPage(props: PageProps<"/pedidos/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const user = await requireUser(undefined, `/pedidos/${id}`);
  const actor = { id: user.id, role: user.role };
  let d: Awaited<ReturnType<typeof getRequestDetail>>;
  try {
    d = await getRequestDetail(actor, id);
  } catch (e) {
    if (e instanceof DomainError) notFound();
    throw e;
  }
  const { request: r, job, quotes, review, claims, status, viewer } = d;
  const isClient = viewer === "cliente";
  const isPro = viewer === "profesional";
  const open = r.status === "solicitado" || r.status === "presupuestado";
  const ownQuote = isPro ? quotes[0] : null;
  const sent = quotes.filter((q) => q.quote.price != null);
  const minPrice = Math.min(...sent.map((q) => q.quote.price ?? Infinity));
  const hiredQuote = quotes.find((q) => q.quote.status === "aceptada");
  const openClaim = claims.find((c) => c.status === "abierto" || c.status === "en_mediacion");

  // Hilos de chat: el cliente tiene uno por profesional; el profesional sólo el suyo.
  const threadPros = quotes.filter((q) => !["rechazada", "descartada"].includes(q.quote.status) || q.quote.status === "aceptada");
  const conParam = typeof sp.con === "string" ? sp.con : undefined;
  const activePro = isPro ? user.id : (threadPros.find((q) => q.quote.professionalId === conParam) ?? hiredQuote ?? threadPros.find((q) => q.quote.status === "enviada") ?? threadPros[0])?.quote.professionalId;
  const thread = activePro ? await getThread(actor, r.id, activePro) : [];
  const activeProName = quotes.find((q) => q.quote.professionalId === activePro)?.proName;
  const chatClosed = activePro ? ["rechazada", "descartada"].includes(quotes.find((q) => q.quote.professionalId === activePro)?.quote.status ?? "") : true;

  return (
    <div className="container-page py-8 md:py-12">
      <AutoRefresh />
      <nav className="mb-4 text-sm">
        <Link href={isClient ? "/cliente" : isPro ? "/profesional" : "/admin"} className="underline">← Volver a mi panel</Link>
      </nav>
      {sp.enviado === "1" && (
        <div className="mb-6"><Notice tone="success">¡Pedido enviado! Te avisamos por email cuando lleguen los presupuestos.</Notice></div>
      )}

      <header className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">{categoryName(r.categorySlug)} · {r.zone}</p>
            <h1 className="mt-1 text-2xl font-bold uppercase sm:text-3xl">{r.title}</h1>
          </div>
          <StatusBadge status={status} label={JOB_STATUS_LABEL[status]} />
        </div>
        {status !== "cancelado" && <Progress status={status} />}
        <div className="mt-5 grid gap-4 border-t border-border pt-5 md:grid-cols-[1fr_auto]">
          <div>
            <p className="whitespace-pre-line">{r.description}</p>
            {r.photoIds.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Fotos del pedido">
                {r.photoIds.map((f, i) => (
                  <li key={f}>
                    <a href={`/api/archivos/${f}`} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/archivos/${f}`} alt={`Foto ${i + 1} del pedido`} className="size-24 rounded-xl object-cover ring-1 ring-border" loading="lazy" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <dl className="grid h-fit grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-1">
            <div><dt className="text-muted">Urgencia</dt><dd className="font-semibold">{URGENCY_LABEL[r.urgency]}</dd></div>
            <div><dt className="text-muted">Fecha deseada</dt><dd className="font-semibold">{fmtDate(r.desiredDate)}</dd></div>
            <div><dt className="text-muted">Creado</dt><dd className="font-semibold">{fmtDate(r.createdAt)}</dd></div>
            {!isClient && <div><dt className="text-muted">Cliente</dt><dd className="font-semibold">{d.clientName}</dd></div>}
          </dl>
        </div>
      </header>

      {/* ---------- Comparador (cliente / admin) ---------- */}
      {!isPro && (
        <section className="mt-8" aria-labelledby="comparador">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="comparador" className="text-2xl font-bold uppercase">Comparador de presupuestos</h2>
              <p className="text-sm text-muted">{sent.length} de {quotes.length} profesionales respondieron.</p>
            </div>
            {isClient && open && <CancelRequestButton requestId={r.id} />}
          </div>
          <div className="card mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <caption className="sr-only">Presupuestos recibidos, uno por columna</caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 w-36 bg-white p-4 align-bottom text-xs uppercase tracking-wide text-muted">Profesional</th>
                  {quotes.map((q) => (
                    <th key={q.quote.id} scope="col" className={cx("p-4 align-top", q.quote.status === "aceptada" && "bg-orange/10")}>
                      <div className="flex items-center gap-3">
                        <Avatar name={q.proName} size={44} />
                        <div>
                          <Link href={`/profesionales/${q.quote.professionalId}`} className="font-semibold hover:underline">{q.proName}</Link>
                          <p className="text-xs font-normal text-muted">{q.tradeTitle}</p>
                        </div>
                      </div>
                      <div className="mt-2"><StatusBadge status={q.quote.status} label={QUOTE_STATUS_LABEL[q.quote.status]} /></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_th]:sticky [&_th]:left-0 [&_th]:bg-white [&_tr]:border-t [&_tr]:border-border">
                <tr>
                  <th scope="row" className="p-4 font-semibold">Precio</th>
                  {quotes.map((q) => (
                    <td key={q.quote.id} className="p-4">
                      {q.quote.price ? (
                        <>
                          <span className="font-display text-2xl font-bold">{money(q.quote.price)}</span>
                          {q.quote.price === minPrice && sent.length > 1 && <span className="mt-1 block text-xs font-semibold text-success">✓ Menor precio</span>}
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="p-4 font-semibold">Plazo</th>
                  {quotes.map((q) => <td key={q.quote.id} className="p-4">{q.quote.durationText ?? "—"}</td>)}
                </tr>
                <tr>
                  <th scope="row" className="p-4 font-semibold">Disponible desde</th>
                  {quotes.map((q) => <td key={q.quote.id} className="p-4">{q.quote.availableFrom ? fmtDate(q.quote.availableFrom) : AVAILABILITY_LABEL[q.availability]}</td>)}
                </tr>
                <tr>
                  <th scope="row" className="p-4 font-semibold">Calificación</th>
                  {quotes.map((q) => (
                    <td key={q.quote.id} className="p-4">
                      <span className="flex items-center gap-1.5"><Stars value={q.rating} size={14} /> <strong>{q.rating?.toLocaleString("es-AR") ?? "—"}</strong></span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="p-4 font-semibold">Experiencia</th>
                  {quotes.map((q) => <td key={q.quote.id} className="p-4">{q.yearsExperience} años · {q.jobsDone} trabajos en la plataforma</td>)}
                </tr>
                <tr>
                  <th scope="row" className="p-4 font-semibold">Verificación</th>
                  {quotes.map((q) => (
                    <td key={q.quote.id} className="p-4">{q.verificationStatus === "verificado" ? <VerifiedBadge date={q.verifiedAt} /> : <span className="text-muted">No vigente</span>}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="p-4 font-semibold">Mensaje</th>
                  {quotes.map((q) => <td key={q.quote.id} className="max-w-xs p-4 text-muted">{q.quote.message ?? "—"}</td>)}
                </tr>
                {isClient && (
                  <tr>
                    <th scope="row" className="p-4"><span className="sr-only">Acciones</span></th>
                    {quotes.map((q) => (
                      <td key={q.quote.id} className="p-4">
                        <div className="flex flex-col gap-2">
                          {open && q.quote.status === "enviada" && <HireButton requestId={r.id} quoteId={q.quote.id} proName={q.proName} />}
                          {!["rechazada", "descartada"].includes(q.quote.status) && (
                            <Link href={`/pedidos/${r.id}?con=${q.quote.professionalId}#chat`} className="inline-flex items-center justify-center gap-1 text-sm font-semibold underline">
                              <IconChat size={16} /> Chatear
                            </Link>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {sent.length === 0 && open && <p className="mt-3 text-sm text-muted">Todavía no llegaron presupuestos. Suelen llegar dentro de las primeras 24 h.</p>}
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* ---------- Columna de acciones ---------- */}
        <div className="space-y-6">
          {isPro && ownQuote && (
            <section className="card p-6" aria-labelledby="mi-presupuesto">
              <div className="flex items-center justify-between gap-2">
                <h2 id="mi-presupuesto" className="text-xl font-bold uppercase">Tu presupuesto</h2>
                <StatusBadge status={ownQuote.quote.status} label={QUOTE_STATUS_LABEL[ownQuote.quote.status]} />
              </div>
              {open && ["solicitada", "enviada"].includes(ownQuote.quote.status) ? (
                <div className="mt-4 space-y-4">
                  <QuoteForm requestId={r.id} quoteId={ownQuote.quote.id} initial={ownQuote.quote.price ? ownQuote.quote : undefined} />
                  {ownQuote.quote.status === "solicitada" && (
                    <form action={declineQuoteAction}>
                      <input type="hidden" name="quoteId" value={ownQuote.quote.id} />
                      <input type="hidden" name="requestId" value={r.id} />
                      <button className="text-sm font-semibold text-muted underline">No puedo tomar este trabajo</button>
                    </form>
                  )}
                </div>
              ) : (
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-muted">Precio</dt><dd className="font-display text-2xl font-bold">{money(ownQuote.quote.price)}</dd></div>
                  <div><dt className="text-muted">Plazo</dt><dd className="font-semibold">{ownQuote.quote.durationText ?? "—"}</dd></div>
                </dl>
              )}
            </section>
          )}

          {job && (
            <section className="card p-6" aria-labelledby="trabajo">
              <h2 id="trabajo" className="text-xl font-bold uppercase">Trabajo</h2>
              <p className="mt-1 text-sm text-muted">
                Contratado el {fmtDate(job.hiredAt)}
                {hiredQuote && <> · {hiredQuote.proName} · {money(hiredQuote.quote.price)}</>}
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div><dt className="text-muted">Inicio</dt><dd className="font-semibold">{fmtDate(job.startedAt)}</dd></div>
                <div><dt className="text-muted">Fin</dt><dd className="font-semibold">{fmtDate(job.finishedAt)}</dd></div>
                <div><dt className="text-muted">Estado</dt><dd className="font-semibold">{JOB_STATUS_LABEL[job.status]}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                {isPro && job.status === "contratado" && <JobButton requestId={r.id} jobId={job.id} op="start" label="Marcar como en curso" />}
                {(isPro || isClient) && (job.status === "contratado" || job.status === "en_curso") && (
                  <JobButton requestId={r.id} jobId={job.id} op="finish" label="Marcar como finalizado" variant={isPro && job.status === "contratado" ? "secondary" : "primary"} confirmText="¿Confirmás que el trabajo está terminado?" />
                )}
              </div>
            </section>
          )}

          {isClient && job?.finishedAt && !review && (
            <section className="card border-2 !border-orange p-6" aria-labelledby="calificar">
              <h2 id="calificar" className="text-xl font-bold uppercase">Calificá el trabajo</h2>
              <p className="mb-4 mt-1 text-sm text-muted">Tu reseña ayuda a otras personas a decidir con confianza.</p>
              <ReviewForm requestId={r.id} jobId={job.id} proName={hiredQuote?.proName ?? "el profesional"} />
            </section>
          )}

          {review && (
            <section className="card p-6" aria-labelledby="resena">
              <h2 id="resena" className="text-xl font-bold uppercase">Reseña</h2>
              <div className="mt-2 flex items-center gap-2">
                <Stars value={review.rating} />
                {review.moderationStatus !== "publicada" && <StatusBadge status={review.moderationStatus} label={review.moderationStatus === "en_revision" ? "En revisión" : "Oculta"} />}
              </div>
              <p className="mt-2">{review.comment}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">{review.tags.map((t) => <Chip key={t} className="!py-0.5 text-xs">{t}</Chip>)}</div>
            </section>
          )}

          {(job?.finishedAt || claims.length > 0) && (
            <section className="card-alt p-6" aria-labelledby="respaldo">
              <h2 id="respaldo" className="flex items-center gap-2 text-xl font-bold uppercase"><IconShieldCheck /> Respaldo</h2>
              {claims.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {claims.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3">
                      <span className="text-sm">Reclamo del {fmtDate(c.createdAt)}</span>
                      <span className="flex items-center gap-3">
                        <StatusBadge status={c.status} label={CLAIM_STATUS_LABEL[c.status]} />
                        <Link href={`/reclamos/${c.id}`} className="text-sm font-semibold underline">Ver seguimiento</Link>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {isClient && job?.finishedAt && !openClaim && (
                <div className="mt-3">
                  <p className="mb-3 text-sm text-muted">¿Algo no salió como esperabas? Abrí un reclamo y mediamos con el profesional.</p>
                  <Collapsible label="Abrir un reclamo">
                    <ClaimForm jobId={job.id} />
                  </Collapsible>
                </div>
              )}
            </section>
          )}
        </div>

        {/* ---------- Chat ---------- */}
        <section id="chat" className="card flex h-fit flex-col p-0 scroll-mt-24" aria-labelledby="chat-title">
          <div className="border-b border-border p-5">
            <h2 id="chat-title" className="flex items-center gap-2 text-xl font-bold uppercase"><IconChat /> Chat del pedido</h2>
            {isClient && threadPros.length > 1 && (
              <nav aria-label="Conversaciones" className="mt-3 flex flex-wrap gap-2">
                {threadPros.map((q) => (
                  <Link key={q.quote.professionalId} href={`/pedidos/${r.id}?con=${q.quote.professionalId}#chat`} aria-current={q.quote.professionalId === activePro ? "true" : undefined} className={cx("rounded-full border px-3 py-1 text-sm font-medium", q.quote.professionalId === activePro ? "border-ink bg-ink text-paper" : "border-border bg-paper-2")}>
                    {q.proName}
                  </Link>
                ))}
              </nav>
            )}
            {activeProName && !isPro && <p className="mt-2 text-sm text-muted">Conversación con {activeProName}</p>}
            {isPro && <p className="mt-2 text-sm text-muted">Conversación con {d.clientName}</p>}
          </div>
          <ol className="flex max-h-[28rem] min-h-40 flex-col gap-3 overflow-y-auto p-5" aria-live="polite">
            {thread.length === 0 && <li className="m-auto text-sm text-muted">Todavía no hay mensajes. Coordiná todo por acá: queda registrado.</li>}
            {thread.map((m) => {
              const mine = m.senderId === user.id;
              return (
                <li key={m.id} className={cx("max-w-[85%] rounded-2xl px-4 py-2.5", mine ? "self-end bg-ink text-paper" : "self-start bg-paper-2")}>
                  <span className="sr-only">{mine ? "Vos" : isPro ? d.clientName : activeProName}: </span>
                  <p className="whitespace-pre-line">{m.body}</p>
                  <p className={cx("mt-1 text-right text-[11px]", mine ? "text-muted-light" : "text-muted")}>{fmtDateTime(m.createdAt)}</p>
                </li>
              );
            })}
          </ol>
          {activePro && viewer !== "admin" && (
            <div className="border-t border-border p-4">
              {chatClosed ? <p className="text-sm text-muted">Esta conversación está cerrada.</p> : <MessageForm requestId={r.id} professionalId={activePro} />}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
