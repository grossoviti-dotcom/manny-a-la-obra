"use client";

import { useActionState, useState } from "react";
import { createRequestAction } from "@/app/actions/flow";
import { FieldError, FormMessage, SubmitButton, invalid } from "@/components/form";
import { Avatar, Stars, cx } from "@/components/ui";
import { CATEGORIES, URGENCY_LABEL, ZONES } from "@/lib/constants";

type Pro = { id: string; name: string; tradeTitle: string; rating: number | null; reviewCount: number; categories: string[]; zones: string[] };

export function RequestForm({ pros, preselected, defaultCategory, defaultZone }: { pros: Pro[]; preselected: string[]; defaultCategory?: string; defaultZone?: string }) {
  const [state, action] = useActionState(createRequestAction, {});
  const [category, setCategory] = useState(defaultCategory ?? "");
  const [selected, setSelected] = useState<string[]>(preselected);
  const visible = pros.filter((p) => !category || p.categories.includes(category) || preselected.includes(p.id));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 5 ? s : [...s, id]));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1.2fr_1fr]" noValidate>
      <div className="card space-y-5 p-6">
        <h2 className="font-display text-xl font-semibold uppercase">1. Contanos qué necesitás</h2>
        <FormMessage state={state} />
        <div>
          <label htmlFor="categorySlug" className="label">Servicio</label>
          <select id="categorySlug" name="categorySlug" value={category} onChange={(e) => setCategory(e.target.value)} className="input" {...invalid(state, "categorySlug")}>
            <option value="" disabled>Elegí un servicio</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <FieldError state={state} name="categorySlug" />
        </div>
        <div>
          <label htmlFor="title" className="label">Título corto</label>
          <input id="title" name="title" maxLength={90} placeholder="Ej.: Pérdida de agua debajo de la bacha" className="input" {...invalid(state, "title")} />
          <FieldError state={state} name="title" />
        </div>
        <div>
          <label htmlFor="description" className="label">Descripción</label>
          <textarea id="description" name="description" rows={5} maxLength={2000} aria-describedby="desc-help" placeholder="¿Qué pasa? ¿Desde cuándo? ¿Qué tipo de vivienda es (casa, depto, piso)?" className="input" {...invalid(state, "description")} />
          <p id="desc-help" className="mt-1 text-sm text-muted">Cuanto más detalle, más preciso el presupuesto. No incluyas tu dirección exacta.</p>
          <FieldError state={state} name="description" />
        </div>
        <div>
          <label htmlFor="photos" className="label">Fotos <span className="font-normal text-muted">(opcional, hasta 4 · JPG, PNG o WEBP · 5 MB c/u)</span></label>
          <input id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:font-semibold file:text-paper" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="zone" className="label">Zona / barrio</label>
            <select id="zone" name="zone" defaultValue={defaultZone ?? ""} className="input" {...invalid(state, "zone")}>
              <option value="" disabled>Elegí tu zona</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
            <FieldError state={state} name="zone" />
          </div>
          <div>
            <label htmlFor="desiredDate" className="label">Fecha deseada <span className="font-normal text-muted">(opcional)</span></label>
            <input id="desiredDate" name="desiredDate" type="date" min={today} className="input" />
          </div>
        </div>
        <fieldset>
          <legend className="label">Urgencia</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(URGENCY_LABEL) as (keyof typeof URGENCY_LABEL)[]).map((u) => (
              <label key={u} className="cursor-pointer">
                <input type="radio" name="urgency" value={u} defaultChecked={u === "media"} className="peer sr-only" />
                <span className="inline-block rounded-full border border-border bg-white px-4 py-2 text-sm font-medium peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-orange">
                  {URGENCY_LABEL[u]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="space-y-4">
        <fieldset className="card p-6">
          <legend className="sr-only">Profesionales</legend>
          <h2 className="font-display text-xl font-semibold uppercase">2. ¿A quiénes se lo enviamos?</h2>
          <p className="mt-1 text-sm text-muted">Elegí hasta 5 profesionales para comparar presupuestos. Seleccionados: <strong>{selected.length}</strong>/5</p>
          <FieldError state={state} name="professionalIds" />
          <ul className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {visible.map((p) => {
              const on = selected.includes(p.id);
              return (
                <li key={p.id}>
                  <label className={cx("flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-orange", on ? "border-ink bg-white" : "border-border bg-paper-2")}>
                    <input type="checkbox" name="professionalIds" value={p.id} checked={on} onChange={() => toggle(p.id)} disabled={!on && selected.length >= 5} className="size-5 shrink-0 accent-[#1C1F24]" />
                    <Avatar name={p.name} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{p.name}</span>
                      <span className="block truncate text-sm text-muted">{p.tradeTitle}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end text-xs">
                      <Stars value={p.rating} size={12} />
                      <span className="text-muted">{p.rating?.toLocaleString("es-AR") ?? "—"} ({p.reviewCount})</span>
                    </span>
                  </label>
                </li>
              );
            })}
            {visible.length === 0 && <li className="text-sm text-muted">Elegí un servicio para ver profesionales.</li>}
          </ul>
        </fieldset>
        <SubmitButton className="w-full" pendingText="Enviando pedido…">
          Enviar pedido de presupuesto
        </SubmitButton>
        <p className="text-center text-xs text-muted">Gratis y sin compromiso. Los profesionales responden dentro de la plataforma.</p>
      </div>
    </form>
  );
}
