import type { Metadata } from "next";
import { ButtonLink, PageHeader, VerifiedBadge } from "@/components/ui";
import { IconCheck, IconStar } from "@/components/icons";
import { PLANS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Para profesionales",
  description: "Conseguí clientes en Rosario, mostrá tus trabajos y construí tu reputación digital con la insignia de profesional verificado.",
};

export default function ForProsPage() {
  return (
    <>
      <section className="bg-ink text-paper">
        <div className="container-page py-14 md:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-orange">Para profesionales</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-bold uppercase leading-tight sm:text-5xl">Tu trabajo bien hecho merece que lo encuentren</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-light">Recibí pedidos de clientes de tu zona, respondé con tu presupuesto y construí una reputación basada en trabajos reales.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/registrarse?rol=profesional">Sumate gratis</ButtonLink>
            <ButtonLink href="#planes" variant="onDark">Ver planes</ButtonLink>
          </div>
        </div>
      </section>
      <div className="container-page py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Clientes de tu zona", "Elegís en qué barrios trabajás y te llegan pedidos con descripción y fotos, listos para presupuestar."],
            ["Reputación que se ve", "Cada trabajo terminado suma a tu perfil. Las reseñas son de clientes reales, así que valen más."],
            ["Menos tiempo perdido", "El cliente ya explicó el problema y comparó opciones: llegás a trabajos con intención real de contratar."],
          ].map(([t, d]) => (
            <article key={t} className="card p-6">
              <IconStar className="text-orange" />
              <h2 className="mt-3 text-xl font-semibold uppercase">{t}</h2>
              <p className="mt-2 text-muted">{d}</p>
            </article>
          ))}
        </div>

        <section className="mt-14 grid gap-8 md:grid-cols-2" aria-labelledby="requisitos">
          <div>
            <PageHeader eyebrow="Requisitos" title="Cómo te verificamos" />
            <ol className="space-y-4">
              {[
                "Creás tu cuenta y completás tu perfil: oficio, zonas, experiencia y precio de referencia.",
                "Subís DNI (frente y dorso), una selfie sosteniendo el DNI y, si trabajás con gas o electricidad, tu matrícula.",
                "Nuestro equipo revisa la documentación en 24 a 72 h hábiles.",
                "Una vez aprobado, aparecés en las búsquedas con la insignia Verificado. La verificación se renueva cada 12 meses.",
              ].map((t, i) => (
                <li key={t} className="flex gap-4">
                  <span className="font-display text-3xl font-bold text-orange">{i + 1}</span>
                  <p className="pt-1">{t}</p>
                </li>
              ))}
            </ol>
            <div className="mt-6"><VerifiedBadge compact /></div>
          </div>
          <div className="card-alt p-6">
            <h2 className="font-display text-xl font-semibold uppercase">Tus compromisos</h2>
            <ul className="mt-3 space-y-2">
              {["Presupuestar con claridad y respetar lo acordado.", "Responder los mensajes del cliente dentro de la plataforma.", "Cumplir horarios o avisar con anticipación.", "Participar de la mediación si hay un reclamo."].map((t) => (
                <li key={t} className="flex gap-2"><IconCheck size={18} className="mt-0.5 shrink-0 text-success" /> {t}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">Sos un profesional independiente: Manny a la Obra no es tu empleador ni intermedia en la relación laboral.</p>
          </div>
        </section>

        <section id="planes" className="mt-14 scroll-mt-24" aria-labelledby="planes-title">
          <h2 id="planes-title" className="text-3xl font-bold uppercase">Planes</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((k) => (
              <article key={k} className={k === "premium" ? "rounded-[18px] bg-ink p-6 text-paper" : "card p-6"}>
                <h3 className="text-2xl font-semibold uppercase">{PLANS[k].name}</h3>
                <p className={`mt-1 font-display text-4xl font-bold ${k === "premium" ? "text-orange" : ""}`}>{PLANS[k].price}</p>
                <p className={`mt-3 ${k === "premium" ? "text-muted-light" : "text-muted"}`}>{PLANS[k].detail}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {(k === "gratis"
                    ? ["Perfil verificado", "Pedidos de presupuesto ilimitados", "Chat con clientes", "Comisión del 15% por trabajo concretado"]
                    : ["Todo lo del plan Gratis", "Prioridad en los resultados", "Insignia Destacado", "Estadísticas de tu perfil"]
                  ).map((t) => (
                    <li key={t} className="flex gap-2"><IconCheck size={18} className="shrink-0 text-success" /> {t}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">En esta etapa (MVP) la comisión y el plan Premium se gestionan por fuera de la plataforma: no se cobra nada online.</p>
          <ButtonLink href="/registrarse?rol=profesional" className="mt-6">Crear mi cuenta profesional</ButtonLink>
        </section>
      </div>
    </>
  );
}
