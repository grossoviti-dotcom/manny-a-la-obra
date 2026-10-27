import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { IconCheck, IconLock, IconShieldCheck } from "@/components/icons";
import { DOC_TYPE_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Seguridad y verificación",
  description: "Qué verificamos de cada profesional, cómo funcionan las reseñas y cómo cuidamos tus datos.",
};

export default function SecurityPage() {
  return (
    <div className="container-page py-12">
      <PageHeader eyebrow="Seguridad" title="Qué verificamos y cómo te cuidamos">
        Dejar entrar a alguien a tu casa requiere confianza. Por eso verificamos a cada profesional antes de que aparezca en las búsquedas, y te mostramos qué verificamos.
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-6">
          <h2 className="flex items-center gap-2 text-2xl font-bold uppercase"><IconShieldCheck className="text-success" /> Verificación</h2>
          <ul className="mt-4 space-y-3">
            {Object.values(DOC_TYPE_LABEL).map((d) => (
              <li key={d} className="flex gap-2"><IconCheck size={18} className="mt-0.5 shrink-0 text-success" /> {d}{d.startsWith("Matrícula") && " (obligatoria en gas y electricidad)"}</li>
            ))}
            <li className="flex gap-2"><IconCheck size={18} className="mt-0.5 shrink-0 text-success" /> Revisión manual del equipo antes de aprobar</li>
            <li className="flex gap-2"><IconCheck size={18} className="mt-0.5 shrink-0 text-success" /> Revalidación anual: si la verificación vence, el perfil deja de aparecer</li>
          </ul>
          <p className="mt-4 text-sm text-muted">La insignia <strong>Verificado</strong> siempre muestra la fecha de verificación. Si un profesional acumula reclamos sin resolver, podemos suspenderla.</p>
        </section>
        <section className="card p-6">
          <h2 className="text-2xl font-bold uppercase">Reseñas reales</h2>
          <ul className="mt-4 space-y-3 text-muted">
            <li>Sólo puede calificar el cliente que contrató y finalizó el trabajo en la plataforma. Una reseña por trabajo.</li>
            <li>Las reseñas con enlaces, teléfonos o lenguaje ofensivo pasan por moderación antes de publicarse.</li>
            <li>Los profesionales pueden denunciar una reseña, pero no borrarla. Decide el equipo, con criterios públicos.</li>
          </ul>
          <Link href="/legal/resenas" className="mt-4 inline-block font-semibold underline">Política de reseñas</Link>
        </section>
        <section className="card p-6">
          <h2 className="flex items-center gap-2 text-2xl font-bold uppercase"><IconLock /> Tus datos</h2>
          <ul className="mt-4 space-y-3 text-muted">
            <li>Los documentos de verificación los ven sólo el profesional y nuestro equipo. Nunca se publican.</li>
            <li>Tu dirección exacta no se muestra: el profesional ve tu barrio hasta que lo contratás y coordinan por chat.</li>
            <li>Tratamos los datos según la Ley 25.326 de Protección de Datos Personales.</li>
          </ul>
          <Link href="/legal/privacidad" className="mt-4 inline-block font-semibold underline">Política de privacidad</Link>
        </section>
        <section className="card-alt p-6">
          <h2 className="text-2xl font-bold uppercase">Consejos para el día del trabajo</h2>
          <ul className="mt-4 space-y-3">
            {[
              "Coordiná todo por el chat del pedido: queda registrado si después hay que reclamar.",
              "Antes de abrir la puerta, confirmá que es la persona del perfil (nombre y foto).",
              "Si estás sola/o y preferís, pedile a alguien de confianza que esté o avisale el horario.",
              "No pagues por adelantado el total. Acordá el pago contra trabajo terminado.",
              "Si algo no te cierra, cancelá: no hace falta dar explicaciones.",
            ].map((t) => (
              <li key={t} className="flex gap-2"><IconCheck size={18} className="mt-0.5 shrink-0 text-success" /> {t}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
