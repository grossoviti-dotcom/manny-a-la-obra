import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth/session";
import { getOwnProfile } from "@/lib/services/verification";
import { Notice } from "@/components/ui";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mi perfil profesional", robots: { index: false } };

export default async function ProProfilePage(props: PageProps<"/profesional/perfil">) {
  const sp = await props.searchParams;
  const user = await requireUser("profesional");
  const p = await getOwnProfile({ id: user.id, role: user.role });
  const [u] = await db.select({ phone: schema.users.phone }).from(schema.users).where(eq(schema.users.id, user.id));
  const locked = p.verificationStatus === "en_revision";
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <section className="card p-6">
        <h1 className="text-2xl font-bold uppercase">Mi perfil</h1>
        {sp.bienvenida === "1" && (
          <div className="mt-4"><Notice tone="success">¡Bienvenido/a! Paso 1: completá tu perfil. Paso 2: subí tu documentación para verificarte.</Notice></div>
        )}
        {locked && <div className="mt-4"><Notice tone="warn">Tu perfil está en revisión: los datos se pueden editar cuando terminemos de verificarte.</Notice></div>}
        <div className="mt-6">
          <ProfileForm locked={locked} initial={{ ...p, phone: u.phone }} />
        </div>
      </section>
      <aside className="card-alt h-fit space-y-3 p-6 text-sm">
        <h2 className="font-display text-lg font-semibold uppercase">Siguiente paso</h2>
        <p className="text-muted">Con el perfil completo, subí tu DNI, una selfie y tu matrícula (si aplica) para que podamos verificarte.</p>
        <Link href="/profesional/verificacion" className="font-semibold underline">Ir a verificación →</Link>
        {p.verificationStatus === "verificado" && (
          <p><Link href={`/profesionales/${user.id}`} className="font-semibold underline">Ver mi perfil público</Link></p>
        )}
      </aside>
    </div>
  );
}
