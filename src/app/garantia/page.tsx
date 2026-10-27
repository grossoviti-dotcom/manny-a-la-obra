import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, PageHeader, StatusBadge } from "@/components/ui";
import { IconCheck } from "@/components/icons";

export const metadata: Metadata = {
  title: "Garantía y respaldo",
  description: "Qué pasa si el trabajo queda mal: cómo abrir un reclamo, cómo mediamos y en qué plazos respondemos.",
};

export default function GuaranteePage() {
  return (
    <div className="container-page py-12">
      <PageHeader eyebrow="Respaldo" title="¿Qué hago si el trabajo queda mal?">
        No te quedás solo/a. Cuando contratás a través de Manny a la Obra, cada trabajo tiene un registro (presupuesto, chat y estados) y un canal formal de reclamo con seguimiento.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-6 md:p-8">
          <h2 className="text-2xl font-bold uppercase">Cómo es un reclamo</h2>
          <ol className="mt-5 space-y-5">
            {[
              ["abierto", "Abierto", "Desde tu pedido finalizado tocás “Abrir reclamo”, elegís el motivo, contás qué pasó y sumás fotos. Te confirmamos la recepción por email."],
              ["en_mediacion", "En mediación", "En hasta 48 h hábiles alguien del equipo revisa el presupuesto, el chat y las fotos, y contacta a ambas partes para buscar una solución: volver a hacer el trabajo, corregirlo o ajustar el precio."],
              ["resuelto", "Resuelto", "Registramos el acuerdo alcanzado y te lo mostramos en el seguimiento. Si no hay acuerdo, el reclamo se cierra con nuestro dictamen y puede afectar la verificación del profesional."],
            ].map(([s, l, d]) => (
              <li key={s} className="flex gap-4">
                <div className="pt-0.5"><StatusBadge status={s} label={l} /></div>
                <p className="text-muted">{d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-muted">
            Podés seguir el estado de cada reclamo desde <strong>Mi panel → Mis reclamos</strong>. Ver la <Link href="/legal/reclamos" className="underline">Política de reclamos y garantía</Link>.
          </p>
        </section>
        <aside className="space-y-4">
          <div className="card-alt p-6">
            <h2 className="font-display text-xl font-semibold uppercase">Qué cubre hoy</h2>
            <ul className="mt-3 space-y-2">
              {["Mediación gratuita entre vos y el profesional.", "Registro de todo lo acordado (presupuesto + chat).", "Seguimiento visible de cada paso del reclamo.", "Consecuencias para profesionales con incumplimientos: pueden perder la insignia de verificado."].map((t) => (
                <li key={t} className="flex gap-2"><IconCheck className="mt-0.5 shrink-0 text-success" size={18} /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold uppercase">Lo que viene</h2>
            <p className="mt-2 text-sm text-muted">
              Estamos trabajando en pagos dentro de la plataforma con retención hasta que confirmes que el trabajo está bien, y en una garantía formal con una aseguradora.
              Mientras tanto, te recomendamos acordar todo por el chat del pedido.
            </p>
          </div>
          <ButtonLink href="/buscar" className="w-full">Buscar profesional</ButtonLink>
        </aside>
      </div>
    </div>
  );
}
