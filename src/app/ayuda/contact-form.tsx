"use client";

import { useActionState } from "react";
import { contactAction } from "@/app/actions/contact";
import { FieldError, FormMessage, SubmitButton, invalid } from "@/components/form";

export function ContactForm() {
  const [state, action] = useActionState(contactAction, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div className="hidden" aria-hidden>
        <label>No completar <input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="label">Nombre</label>
          <input id="c-name" name="name" autoComplete="name" className="input" {...invalid(state, "name")} />
          <FieldError state={state} name="name" />
        </div>
        <div>
          <label htmlFor="c-email" className="label">Email</label>
          <input id="c-email" name="email" type="email" autoComplete="email" className="input" {...invalid(state, "email")} />
          <FieldError state={state} name="email" />
        </div>
      </div>
      <div>
        <label htmlFor="c-topic" className="label">Motivo</label>
        <select id="c-topic" name="topic" className="input" defaultValue="consulta">
          <option value="consulta">Consulta general</option>
          <option value="profesional">Soy profesional</option>
          <option value="reclamo">Problema con un trabajo</option>
          <option value="prensa">Prensa, alianzas o inversores</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      <div>
        <label htmlFor="c-message" className="label">Mensaje</label>
        <textarea id="c-message" name="message" rows={5} className="input" {...invalid(state, "message")} />
        <FieldError state={state} name="message" />
      </div>
      <SubmitButton>Enviar mensaje</SubmitButton>
    </form>
  );
}
