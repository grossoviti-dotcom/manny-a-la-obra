import type { Metadata } from "next";
import { ButtonLink, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description: "Quiénes somos, por qué creamos Manny a la Obra y hacia dónde vamos. Información para aliados e inversores.",
};

const TEAM = ["Alesio Seijas", "Luisina Borgogno", "Valentino Perez", "Vito Grosso"];

export default function AboutPage() {
  return (
    <div className="container-page py-12">
      <PageHeader eyebrow="Sobre nosotros" title="Recuperar la confianza al contratar">
        Manny a la Obra nace en Rosario para reducir la incertidumbre de contratar servicios: que puedas saber, antes de decidir, si alguien es confiable.
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Propósito", "Reducir la incertidumbre y recuperar la confianza en la contratación de servicios profesionales."],
          ["Misión", "Conectar personas con profesionales confiables mediante una plataforma digital que facilite la búsqueda, comparación y contratación, con información transparente, reputación basada en experiencias reales y mecanismos de respaldo."],
          ["Visión", "Ser la plataforma de referencia en Argentina para contratar servicios profesionales con seguridad."],
        ].map(([t, d]) => (
          <article key={t} className="card p-6">
            <h2 className="text-xl font-semibold uppercase text-orange-deep">{t}</h2>
            <p className="mt-2">{d}</p>
          </article>
        ))}
      </div>

      <section className="mt-10 rounded-[24px] bg-ink p-8 text-paper" aria-labelledby="pilares">
        <h2 id="pilares" className="text-2xl font-bold uppercase">Nuestros pilares</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            ["Confianza", "Verificamos y mostramos lo que verificamos."],
            ["Transparencia", "Precios comparables y reseñas de trabajos reales."],
            ["Responsabilidad", "Respondemos cuando algo sale mal."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl bg-card-dark p-5">
              <p className="font-display text-2xl font-bold uppercase text-orange">{t}</p>
              <p className="mt-1 text-muted-light">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="equipo">
        <h2 id="equipo" className="text-2xl font-bold uppercase">Equipo fundador</h2>
        <p className="mt-1 text-muted">Proyecto de la Licenciatura en Gestión de Negocios Digitales, Universidad Católica Argentina (sede Rosario).</p>
        <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {TEAM.map((n) => (
            <li key={n} className="card p-5 font-display text-lg font-semibold uppercase">{n}</li>
          ))}
        </ul>
      </section>

      <section id="inversores" className="mt-14 scroll-mt-24" aria-labelledby="inv">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-orange-deep">Para aliados e inversores</p>
        <h2 id="inv" className="mt-1 text-3xl font-bold uppercase">La oportunidad</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["15,7 M", "TAM", "hogares en Argentina (INDEC)."],
            ["10,2 M", "SAM", "hogares en los 31 aglomerados urbanos; 93,7% con internet (2024)."],
            ["100 mil", "SOM", "hogares (1% del SAM), empezando por Rosario y su área de influencia."],
          ].map(([n, k, d]) => (
            <div key={k} className="card p-6">
              <p className="font-display text-4xl font-bold text-orange-deep">{n}</p>
              <p className="mt-1 font-semibold uppercase">{k}</p>
              <p className="text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="card p-6">
            <h3 className="text-xl font-semibold uppercase">Competencia y diferencial</h3>
            <p className="mt-2 text-muted">Directos: Solvit (CABA, servicios para el hogar con profesionales verificados) y Cronoshare (España, presupuestos y valoraciones). Indirectos: Google, redes sociales y recomendaciones personales.</p>
            <p className="mt-2">Nuestro diferencial: la <strong>confianza como eje central</strong> —verificación, reputación real, comparación y respaldo— con amplitud de categorías.</p>
          </article>
          <article className="card p-6">
            <h3 className="text-xl font-semibold uppercase">Modelo de ingresos</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
              <li>Comisión por servicio contratado (15% al profesional).</li>
              <li>Suscripción Premium para profesionales (USD 9/mes, más visibilidad).</li>
              <li>Alianzas B2B con inmobiliarias, consorcios y empresas.</li>
            </ul>
          </article>
          <article className="card p-6 md:col-span-2">
            <h3 className="text-xl font-semibold uppercase">Escenario financiero base</h3>
            <dl className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[["USD 27.400", "Inversión inicial"], ["≈ USD 124 mil", "Necesidad máxima de caja"], ["Mes 33", "Equilibrio operativo"], ["≈ 28%", "TIR con valor terminal (tasa exigida 25%)"]].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-sm text-muted">{l}</dt>
                  <dd className="font-display text-2xl font-bold">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-muted">Supuestos a validar. Marco legal previsto: SAS; marca en INPI (clases 9, 35 y 42); datos personales según Ley 25.326; profesionales independientes sin relación de dependencia.</p>
          </article>
        </div>
        <ButtonLink href="/ayuda#contacto" className="mt-6">Contactar al equipo</ButtonLink>
      </section>
    </div>
  );
}
