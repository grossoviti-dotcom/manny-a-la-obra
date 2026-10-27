"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions/pro";
import { FieldError, FormMessage, SubmitButton, invalid } from "@/components/form";
import { CATEGORIES, LICENSED_CATEGORIES, ZONES } from "@/lib/constants";

type Initial = {
  tradeTitle: string;
  categories: string[];
  bio: string;
  yearsExperience: number;
  zones: string[];
  referencePrice: number | null;
  priceUnit: string;
  availability: string;
  licenseNumber: string | null;
  phone: string | null;
};

const pill =
  "inline-block rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-orange";

export function ProfileForm({ initial, locked }: { initial: Initial; locked: boolean }) {
  const [state, action] = useActionState(updateProfileAction, {});
  return (
    <form action={action} className="space-y-6" noValidate>
      <FormMessage state={state} />
      <fieldset disabled={locked} className="space-y-6 disabled:opacity-70">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tradeTitle" className="label">Oficio / título</label>
            <input id="tradeTitle" name="tradeTitle" defaultValue={initial.tradeTitle} placeholder="Ej.: Electricista matriculado" className="input" {...invalid(state, "tradeTitle")} />
            <FieldError state={state} name="tradeTitle" />
          </div>
          <div>
            <label htmlFor="phone" className="label">Celular de contacto</label>
            <input id="phone" name="phone" type="tel" defaultValue={initial.phone ?? ""} className="input" {...invalid(state, "phone")} />
            <p className="mt-1 text-xs text-muted">No se publica. Lo usamos para la verificación y la mediación.</p>
          </div>
        </div>
        <fieldset>
          <legend className="label">Categorías (hasta 3)</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <label key={c.slug} className="cursor-pointer">
                <input type="checkbox" name="categories" value={c.slug} defaultChecked={initial.categories.includes(c.slug)} className="peer sr-only" />
                <span className={pill}>{c.name}{LICENSED_CATEGORIES.includes(c.slug) && " *"}</span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">* Requiere matrícula.</p>
          <FieldError state={state} name="categories" />
        </fieldset>
        <div>
          <label htmlFor="bio" className="label">Sobre tu trabajo</label>
          <textarea id="bio" name="bio" rows={5} defaultValue={initial.bio} placeholder="Experiencia, especialidades, cómo trabajás, garantía que ofrecés…" className="input" {...invalid(state, "bio")} />
          <FieldError state={state} name="bio" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="yearsExperience" className="label">Años de experiencia</label>
            <input id="yearsExperience" name="yearsExperience" type="number" min={0} max={60} defaultValue={initial.yearsExperience} className="input" />
          </div>
          <div>
            <label htmlFor="referencePrice" className="label">Precio de referencia (ARS)</label>
            <input id="referencePrice" name="referencePrice" type="number" min={0} step={500} defaultValue={initial.referencePrice ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="priceUnit" className="label">Por</label>
            <select id="priceUnit" name="priceUnit" defaultValue={initial.priceUnit} className="input">
              <option value="visita">Visita</option>
              <option value="hora">Hora</option>
              <option value="trabajo">Trabajo</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="availability" className="label">Disponibilidad</label>
            <select id="availability" name="availability" defaultValue={initial.availability} className="input">
              <option value="hoy">Disponible hoy</option>
              <option value="esta_semana">Esta semana</option>
              <option value="a_coordinar">A coordinar</option>
            </select>
          </div>
          <div>
            <label htmlFor="licenseNumber" className="label">N° de matrícula <span className="font-normal text-muted">(si aplica)</span></label>
            <input id="licenseNumber" name="licenseNumber" defaultValue={initial.licenseNumber ?? ""} className="input" />
          </div>
        </div>
        <fieldset>
          <legend className="label">Zonas donde trabajás</legend>
          <div className="flex flex-wrap gap-2">
            {ZONES.map((z) => (
              <label key={z} className="cursor-pointer">
                <input type="checkbox" name="zones" value={z} defaultChecked={initial.zones.includes(z)} className="peer sr-only" />
                <span className={pill}>{z}</span>
              </label>
            ))}
          </div>
          <FieldError state={state} name="zones" />
        </fieldset>
      </fieldset>
      {!locked && (<>
      <div>
        <label htmlFor="avatar" className="label">Foto de perfil <span className="font-normal text-muted">(JPG, PNG o WEBP · máx. 5 MB · pública)</span></label>
        <input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:font-semibold file:text-paper" />
      </div>
      <SubmitButton pendingText="Guardando…">Guardar perfil</SubmitButton>
      </>)}
    </form>
  );
}
