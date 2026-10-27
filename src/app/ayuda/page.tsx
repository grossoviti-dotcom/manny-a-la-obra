import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { SITE } from "@/lib/constants";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Ayuda y preguntas frecuentes",
  description: "Respuestas a las dudas más comunes sobre cómo contratar, presupuestos, verificación, reseñas y reclamos en Manny a la Obra.",
};

const FAQ: { group: string; items: [string, React.ReactNode][] }[] = [
  {
    group: "Para quienes contratan",
    items: [
      ["¿Cuánto cuesta usar Manny a la Obra?", "Para quienes contratan es gratis. Pagás sólo el trabajo, directamente al profesional, según el presupuesto que aceptaste."],
      ["¿A cuántos profesionales puedo pedir presupuesto?", "Hasta 5 por pedido. Contás el problema una vez y cada profesional responde con precio, plazo y un mensaje. Después los comparás lado a lado."],
      ["¿Cómo sé si un precio es razonable?", "Cada perfil muestra un precio de referencia y, al pedir varios presupuestos, ves el rango real para tu trabajo. Si algo te parece raro, preguntá por el chat antes de contratar."],
      ["¿Qué pasa si el trabajo queda mal?", <>Abrís un reclamo desde el pedido y nuestro equipo media. Mirá <Link href="/garantia" className="underline">Garantía y respaldo</Link>.</>],
      ["¿Puedo cancelar un pedido?", "Sí, mientras no hayas contratado a nadie. Una vez contratado, coordiná con el profesional por el chat y, si hay un problema, escribinos."],
    ],
  },
  {
    group: "Verificación y reseñas",
    items: [
      ["¿Qué significa la insignia Verificado?", <>Que validamos la identidad del profesional (DNI y selfie) y su matrícula cuando el oficio la exige. Siempre muestra la fecha. Más en <Link href="/seguridad" className="underline">Seguridad</Link>.</>],
      ["¿Las reseñas pueden ser falsas?", "Sólo puede calificar quien contrató y finalizó el trabajo en la plataforma, una vez por trabajo. Además moderamos reseñas sospechosas."],
    ],
  },
  {
    group: "Para profesionales",
    items: [
      ["¿Cuánto tarda la verificación?", "Entre 24 y 72 h hábiles desde que enviás la documentación completa."],
      ["¿Cuánto cuesta?", <>El plan Gratis no tiene costo fijo; se cobra una comisión del 15% sobre trabajos concretados. El plan Premium cuesta USD 9/mes. Ver <Link href="/para-profesionales#planes" className="underline">planes</Link>.</>],
      ["Me rechazaron la verificación, ¿qué hago?", "En tu panel ves el motivo. Corregí lo que haga falta y volvé a enviarla."],
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="container-page py-12">
      <PageHeader eyebrow="Ayuda" title="Preguntas frecuentes">¿No encontrás lo que buscás? Escribinos al final de la página.</PageHeader>
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          {FAQ.map((g) => (
            <section key={g.group} aria-labelledby={g.group}>
              <h2 id={g.group} className="text-2xl font-bold uppercase">{g.group}</h2>
              <div className="mt-3 space-y-2">
                {g.items.map(([q, a]) => (
                  <details key={q} className="card group p-4 open:pb-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                      {q}
                      <span aria-hidden className="font-display text-xl text-orange-deep transition group-open:rotate-45">+</span>
                    </summary>
                    <div className="mt-2 text-muted">{a}</div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
        <section id="contacto" aria-labelledby="contacto-title" className="scroll-mt-24">
          <div className="card p-6">
            <h2 id="contacto-title" className="text-2xl font-bold uppercase">Contacto</h2>
            <p className="mt-1 text-sm text-muted">También podés escribirnos a <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a>.</p>
            <div className="mt-5"><ContactForm /></div>
          </div>
        </section>
      </div>
    </div>
  );
}
