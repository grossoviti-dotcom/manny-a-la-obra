import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeForRole } from "@/lib/auth/session";
import { RegisterForm } from "./register-form";
import { IconCheck } from "@/components/icons";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage(props: PageProps<"/registrarse">) {
  const sp = await props.searchParams;
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));
  const role = sp.rol === "profesional" ? "profesional" : "cliente";
  return (
    <div className="container-page grid max-w-5xl gap-10 py-12 md:grid-cols-2 md:py-20">
      <div>
        <h1 className="text-4xl font-bold uppercase">Creá tu cuenta</h1>
        <p className="mt-3 text-muted">Es gratis y te lleva un minuto.</p>
        <div className="card mt-8 p-6">
          <RegisterForm initialRole={role} next={typeof sp.next === "string" ? sp.next : undefined} />
          <p className="mt-5 text-sm text-muted">
            ¿Ya tenés cuenta? <Link href="/ingresar" className="font-semibold text-ink underline">Ingresá</Link>
          </p>
        </div>
      </div>
      <aside className="card-alt h-fit p-6">
        <h2 className="font-display text-lg font-semibold uppercase">Lo que te da tu cuenta</h2>
        <ul className="mt-4 space-y-3">
          {[
            "Pedir presupuestos a varios profesionales verificados a la vez.",
            "Comparar precio, plazo, experiencia y reputación lado a lado.",
            "Chatear dentro de la plataforma, con registro de lo acordado.",
            "Calificar sólo trabajos reales y abrir un reclamo si algo sale mal.",
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <IconCheck className="mt-0.5 shrink-0 text-success" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
