import type { Metadata } from "next";
import { ButtonLink, PageHeader, StatusBadge } from "@/components/ui";
import { IconHandshake, IconLifebuoy, IconScale, IconSearch, IconShieldCheck, IconStar } from "@/components/icons";
import { JOB_STATUS_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Cómo funciona",
  description: "Buscar, comparar, verificar, contratar, calificar y respaldar: así funciona Manny a la Obra para contratar servicios con seguridad en Rosario.",
};

const STEPS = [
  { t: "Buscar", icon: IconSearch, d: "Elegí qué necesitás (electricidad, plomería, gas, electrodomésticos, reparaciones o tecnología) y tu barrio. Filtrá por calificación, disponibilidad y precio de referencia. Sólo aparecen profesionales con verificación vigente." },
  { t: "Comparar", icon: IconScale, d: "Contá el problema una sola vez —con fotos si querés— y enviá el pedido a hasta 5 profesionales. Cada uno responde con precio, plazo y un mensaje. Los ves lado a lado en el comparador." },
  { t: "Verificar", icon: IconShieldCheck, d: "Antes de decidir, revisá en cada perfil qué verificamos (identidad, selfie y matrícula), desde cuándo, cuántos trabajos hizo en la plataforma y qué dicen sus clientes." },
  { t: "Contratar", icon: IconHandshake, d: "Elegí el presupuesto que te convence con un clic. El resto de los profesionales recibe un aviso de que el pedido se cerró. Coordiná día y detalles por el chat del pedido: todo queda registrado." },
  { t: "Calificar", icon: IconStar, d: "Cuando el trabajo termina, lo marcás como finalizado y dejás tu reseña con estrellas, comentario y etiquetas (puntualidad, prolijidad, precio justo…). Sólo puede opinar quien contrató." },
  { t: "Respaldar", icon: IconLifebuoy, d: "Si algo sale mal, abrís un reclamo desde el mismo pedido. Nuestro equipo media entre las partes, registra la resolución y te muestra el seguimiento paso a paso." },
];

const FLOW = ["solicitado", "presupuestado", "contratado", "en_curso", "finalizado", "calificado"] as const;

export default function HowItWorks() {
  return (
    <div className="container-page py-12">
      <PageHeader eyebrow="Encontrá. Compará. Confiá." title="Cómo funciona">
        Una forma de contratar servicios en la que la confianza se ve: verificación visible, reseñas ligadas a trabajos reales, precios comparables y reclamos con respuesta.
      </PageHeader>
      <ol className="grid gap-4 md:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s.t} className="card flex gap-4 p-6">
            <span className="font-display text-4xl font-bold text-orange">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-semibold uppercase">
                <s.icon /> {s.t}
              </h2>
              <p className="mt-2 text-muted">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="card-alt mt-10 p-6 md:p-8" aria-labelledby="estados">
        <h2 id="estados" className="text-2xl font-bold uppercase">El recorrido de tu pedido</h2>
        <p className="mt-2 text-muted">En tu panel siempre ves en qué estado está cada pedido.</p>
        <ol className="mt-5 flex flex-wrap items-center gap-2">
          {FLOW.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <StatusBadge status={s} label={`${i + 1}. ${JOB_STATUS_LABEL[s]}`} />
              {i < FLOW.length - 1 && <span aria-hidden className="text-muted">→</span>}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted">
          Si abrís un reclamo sobre un trabajo finalizado, el pedido pasa a <StatusBadge status="en_reclamo" label="En reclamo" /> hasta que se resuelve.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/buscar">Buscar profesional</ButtonLink>
        <ButtonLink href="/garantia" variant="secondary">Ver garantía y respaldo</ButtonLink>
      </div>
    </div>
  );
}
