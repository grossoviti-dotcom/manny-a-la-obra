import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeForRole } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar", robots: { index: false } };

export default async function LoginPage(props: PageProps<"/ingresar">) {
  const { next } = await props.searchParams;
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));
  return (
    <div className="container-page grid max-w-5xl gap-10 py-12 md:grid-cols-2 md:py-20">
      <div>
        <h1 className="text-4xl font-bold uppercase">Ingresá a tu cuenta</h1>
        <p className="mt-3 text-muted">Seguí tus pedidos, compará presupuestos y hablá con los profesionales.</p>
        <div className="card mt-8 p-6">
          <LoginForm next={typeof next === "string" ? next : undefined} />
          <p className="mt-5 text-sm text-muted">
            ¿No tenés cuenta?{" "}
            <Link href={`/registrarse${typeof next === "string" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-ink underline">
              Creala gratis
            </Link>
          </p>
        </div>
      </div>
      <aside className="card-alt h-fit p-6 text-sm">
        <h2 className="font-display text-lg font-semibold uppercase">Cuentas de demostración</h2>
        <p className="mt-2 text-muted">Para probar el MVP podés usar estas cuentas ficticias (contraseña <code className="rounded bg-white px-1.5 py-0.5 font-semibold">demo1234</code>):</p>
        <ul className="mt-3 space-y-1.5">
          <li><strong>Cliente:</strong> lucia@manny.example</li>
          <li><strong>Profesional verificado:</strong> carlos.medina@manny.example</li>
          <li><strong>Profesional en revisión:</strong> franco.ledesma@manny.example</li>
        </ul>
        <p className="mt-3 text-muted">El acceso de administración es privado para el equipo.</p>
      </aside>
    </div>
  );
}
