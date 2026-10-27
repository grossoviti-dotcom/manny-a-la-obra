"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { FieldError, FormMessage, SubmitButton, invalid } from "@/components/form";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <FormMessage state={state} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" {...invalid(state, "email")} />
        <FieldError state={state} name="email" />
      </div>
      <div>
        <label htmlFor="password" className="label">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" {...invalid(state, "password")} />
        <FieldError state={state} name="password" />
      </div>
      <SubmitButton className="w-full" pendingText="Ingresando…">Ingresar</SubmitButton>
    </form>
  );
}
