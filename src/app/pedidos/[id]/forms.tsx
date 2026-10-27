"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cancelRequestAction,
  hireAction,
  jobTransitionAction,
  openClaimAction,
  respondQuoteAction,
  reviewAction,
  sendMessageAction,
} from "@/app/actions/flow";
import { FieldError, FormMessage, SubmitButton, invalid } from "@/components/form";
import { IconStar } from "@/components/icons";
import { cx } from "@/components/ui";
import { CLAIM_REASON_LABEL, REVIEW_TAGS } from "@/lib/constants";

export function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}

export function HireButton({ requestId, quoteId, proName }: { requestId: string; quoteId: string; proName: string }) {
  const [state, action] = useActionState(hireAction, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`¿Confirmás que querés contratar a ${proName}? Los demás presupuestos se descartan.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="quoteId" value={quoteId} />
      <SubmitButton className="w-full !px-3" pendingText="Contratando…">Contratar</SubmitButton>
      {state.error && <p className="mt-1 text-xs font-medium text-danger" role="alert">{state.error}</p>}
    </form>
  );
}

export function JobButton({ requestId, jobId, op, label, variant = "primary", confirmText }: { requestId: string; jobId: string; op: "start" | "finish"; label: string; variant?: "primary" | "secondary"; confirmText?: string }) {
  const [state, action] = useActionState(jobTransitionAction, {});
  return (
    <form action={action} onSubmit={(e) => confirmText && !confirm(confirmText) && e.preventDefault()}>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="op" value={op} />
      <SubmitButton variant={variant} pendingText="Guardando…">{label}</SubmitButton>
      {state.error && <p className="mt-1 text-sm font-medium text-danger" role="alert">{state.error}</p>}
    </form>
  );
}

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const [state, action] = useActionState(cancelRequestAction, {});
  return (
    <form action={action} onSubmit={(e) => !confirm("¿Cancelar este pedido? Los profesionales dejarán de verlo como activo.") && e.preventDefault()}>
      <input type="hidden" name="requestId" value={requestId} />
      <SubmitButton variant="ghost" className="!text-danger" pendingText="Cancelando…">Cancelar pedido</SubmitButton>
      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
    </form>
  );
}

export function QuoteForm({ requestId, quoteId, initial }: { requestId: string; quoteId: string; initial?: { price: number | null; durationText: string | null; availableFrom: string | null; message: string | null } }) {
  const [state, action] = useActionState(respondQuoteAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="quoteId" value={quoteId} />
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="label">Precio total (ARS)</label>
          <input id="price" name="price" type="number" inputMode="numeric" min={1} step={500} defaultValue={initial?.price ?? ""} className="input" {...invalid(state, "price")} />
          <FieldError state={state} name="price" />
        </div>
        <div>
          <label htmlFor="durationText" className="label">Plazo estimado</label>
          <input id="durationText" name="durationText" placeholder="Ej.: 2 horas / 1 día" defaultValue={initial?.durationText ?? ""} className="input" {...invalid(state, "durationText")} />
          <FieldError state={state} name="durationText" />
        </div>
      </div>
      <div>
        <label htmlFor="availableFrom" className="label">Disponible desde <span className="font-normal text-muted">(opcional)</span></label>
        <input id="availableFrom" name="availableFrom" type="date" defaultValue={initial?.availableFrom ?? ""} className="input" />
      </div>
      <div>
        <label htmlFor="message" className="label">Mensaje para el cliente</label>
        <textarea id="message" name="message" rows={4} defaultValue={initial?.message ?? ""} placeholder="Qué incluye el precio, materiales, condiciones de pago…" className="input" {...invalid(state, "message")} />
        <FieldError state={state} name="message" />
      </div>
      <SubmitButton pendingText="Enviando…">{initial?.price ? "Actualizar presupuesto" : "Enviar presupuesto"}</SubmitButton>
    </form>
  );
}

export function MessageForm({ requestId, professionalId }: { requestId: string; professionalId: string }) {
  const [state, action] = useActionState(sendMessageAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="flex items-end gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="professionalId" value={professionalId} />
      <div className="flex-1">
        <label htmlFor={`msg-${professionalId}`} className="sr-only">Escribí un mensaje</label>
        <textarea id={`msg-${professionalId}`} name="body" rows={2} maxLength={2000} required placeholder="Escribí un mensaje…" className="input !rounded-2xl" />
        {state.error && <p className="mt-1 text-sm text-danger" role="alert">{state.error}</p>}
      </div>
      <SubmitButton className="!px-4" pendingText="…">Enviar</SubmitButton>
    </form>
  );
}

export function ReviewForm({ requestId, jobId, proName }: { requestId: string; jobId: string; proName: string }) {
  const [state, action] = useActionState(reviewAction, {});
  const [rating, setRating] = useState(0);
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="jobId" value={jobId} />
      <FormMessage state={state} />
      <fieldset>
        <legend className="label">¿Cómo calificás el trabajo de {proName}?</legend>
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-lg p-1 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-orange">
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
              <IconStar size={34} filled={rating >= n} className={rating >= n ? "text-orange" : "text-border"} />
              <span className="sr-only">{n} {n === 1 ? "estrella" : "estrellas"}</span>
            </label>
          ))}
        </div>
        <FieldError state={state} name="rating" />
      </fieldset>
      <fieldset>
        <legend className="label">¿Qué destacarías? <span className="font-normal text-muted">(opcional)</span></legend>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TAGS.map((t) => (
            <label key={t} className="cursor-pointer">
              <input type="checkbox" name="tags" value={t} className="peer sr-only" />
              <span className="inline-block rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-orange">{t}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="comment" className="label">Tu comentario</label>
        <textarea id="comment" name="comment" rows={4} maxLength={1500} placeholder="Contá cómo fue: puntualidad, prolijidad, si respetó el presupuesto…" className="input" {...invalid(state, "comment")} />
        <FieldError state={state} name="comment" />
      </div>
      <SubmitButton pendingText="Publicando…">Publicar reseña</SubmitButton>
    </form>
  );
}

export function ClaimForm({ jobId }: { jobId: string }) {
  const [state, action] = useActionState(openClaimAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="jobId" value={jobId} />
      <FormMessage state={state} />
      <div>
        <label htmlFor="reason" className="label">Motivo</label>
        <select id="reason" name="reason" defaultValue="" className="input" {...invalid(state, "reason")}>
          <option value="" disabled>Elegí un motivo</option>
          {Object.entries(CLAIM_REASON_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <FieldError state={state} name="reason" />
      </div>
      <div>
        <label htmlFor="claim-description" className="label">¿Qué pasó?</label>
        <textarea id="claim-description" name="description" rows={4} className="input" {...invalid(state, "description")} />
        <FieldError state={state} name="description" />
      </div>
      <div>
        <label htmlFor="claim-photos" className="label">Fotos <span className="font-normal text-muted">(opcional, hasta 4)</span></label>
        <input id="claim-photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:font-semibold file:text-paper" />
      </div>
      <SubmitButton variant="danger" pendingText="Enviando…">Abrir reclamo</SubmitButton>
    </form>
  );
}

export function Collapsible({ label, children, defaultOpen }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group">
      <summary className={cx("inline-flex cursor-pointer list-none items-center gap-2 font-semibold underline underline-offset-4 [&::-webkit-details-marker]:hidden")}>{label}</summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
