"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { FieldError, FormMessage, SubmitButton, invalid } from "@/components/form";
import { cx } from "@/components/ui";

export function RegisterForm({ initialRole, next }: { initialRole: "cliente" | "profesional"; next?: string }) {
  const [state, action] = useActionState(registerAction, {});
  const [role, setRole] = useState(initialRole);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <fieldset>
        <legend className="label">¿Cómo querés usar Manny a la Obra?</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["cliente", "Necesito contratar", "Busco profesionales"],
              ["profesional", "Soy profesional", "Ofrezco mis servicios"],
            ] as const
          ).map(([value, title, sub]) => (
            <label
              key={value}
              className={cx(
                "cursor-pointer rounded-2xl border-2 p-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-orange",
                role === value ? "border-ink bg-white" : "border-border bg-paper-2",
              )}
            >
              <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="sr-only" />
              <span className="flex items-center gap-2 font-semibold">
                <span className={cx("size-4 rounded-full border-2 border-ink", role === value && "bg-orange")} aria-hidden />
                {title}
              </span>
              <span className="mt-1 block text-sm text-muted">{sub}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <FormMessage state={state} />
      <div>
        <label htmlFor="name" className="label">Nombre y apellido</label>
        <input id="name" name="name" autoComplete="name" required className="input" {...invalid(state, "name")} />
        <FieldError state={state} name="name" />
      </div>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" {...invalid(state, "email")} />
        <FieldError state={state} name="email" />
      </div>
      <div>
        <label htmlFor="phone" className="label">
          Celular <span className="font-normal text-muted">(opcional)</span>
        </label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="341 155 123456" className="input" {...invalid(state, "phone")} />
        <FieldError state={state} name="phone" />
      </div>
      <div>
        <label htmlFor="password" className="label">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} aria-describedby="pw-help" className="input" {...invalid(state, "password")} />
        <p id="pw-help" className="mt-1 text-sm text-muted">Mínimo 8 caracteres.</p>
        <FieldError state={state} name="password" />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="terms" className="mt-1 size-5 accent-[#E8641C]" required />
        <span>
          Acepto los <Link href="/legal/terminos" className="font-semibold underline">Términos y condiciones</Link> y la{" "}
          <Link href="/legal/privacidad" className="font-semibold underline">Política de privacidad</Link>.
        </span>
      </label>
      <FieldError state={state} name="terms" />
      <SubmitButton className="w-full" pendingText="Creando cuenta…">
        {role === "profesional" ? "Crear cuenta profesional" : "Crear cuenta"}
      </SubmitButton>
    </form>
  );
}
