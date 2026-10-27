import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { ButtonLink, Stars, VerifiedBadge } from "@/components/ui";
import { CategoryIcon, IconArrowRight, IconChat, IconHandshake, IconLifebuoy, IconScale, IconSearch, IconShieldCheck, IconStar } from "@/components/icons";
import { CATEGORIES, SITE, categoryName } from "@/lib/constants";
import { categoryCounts, featuredReviews } from "@/lib/services/search";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "01", t: "Buscar", d: "Elegí el servicio y tu barrio. Sólo ves profesionales verificados.", icon: IconSearch },
  { n: "02", t: "Comparar", d: "Pedí presupuesto a varios y comparalos lado a lado.", icon: IconScale },
  { n: "03", t: "Verificar", d: "Mirá su identidad validada, matrícula, trabajos y reseñas reales.", icon: IconShieldCheck },
  { n: "04", t: "Contratar", d: "Elegí el que te convence y coordiná por el chat de la plataforma.", icon: IconHandshake },
  { n: "05", t: "Calificar", d: "Al terminar, dejá tu reseña. Sólo opina quien contrató.", icon: IconStar },
  { n: "06", t: "Respaldar", d: "Si algo sale mal, abrís un reclamo y mediamos por vos.", icon: IconLifebuoy },
];

const PILLARS = [
  { t: "Profesionales verificados", d: "Validamos DNI, identidad con selfie y matrícula cuando el oficio la exige. La verificación se renueva cada año.", icon: IconShieldCheck },
  { t: "Reputación real", d: "Cada reseña está ligada a un trabajo contratado y finalizado en la plataforma. Nadie puede opinar sin haber contratado.", icon: IconStar },
  { t: "Comparación de presupuestos", d: "Precio, plazo, experiencia y calificación en una sola tabla. Decidís con información, no a ciegas.", icon: IconScale },
  { t: "Respaldo y garantía", d: "Si el trabajo queda mal, abrís un reclamo y nuestro equipo media hasta resolverlo. Todo queda registrado.", icon: IconLifebuoy },
];

export default async function HomePage() {
  const [counts, reviews, statsRes] = await Promise.all([
    categoryCounts(),
    featuredReviews(3),
    db.execute(sql`select
      (select count(*)::int from professional_profiles where verification_status='verificado' and verification_expires_at > now()) pros,
      (select count(*)::int from reviews where moderation_status='publicada') reviews,
      (select round(avg(rating)::numeric,1)::float from reviews where moderation_status='publicada') avg`),
  ]);
  const stats = statsRes.rows[0] as { pros: number; reviews: number; avg: number | null };

  return (
    <>
      <section className="bg-ink text-paper">
        <div className="container-page grid gap-10 py-14 md:py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-card-dark px-3 py-1 text-sm text-muted-light">
              <IconShieldCheck size={16} className="text-orange" /> Rosario y alrededores
            </p>
            <h1 className="text-5xl font-bold uppercase leading-[0.95] sm:text-6xl lg:text-7xl">
              Encontrá.
              <br />
              Compará.
              <br />
              <span className="text-orange">Confiá.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-light">{SITE.descriptor} Electricistas, plomeros, gasistas y técnicos verificados, con reseñas de trabajos reales.</p>
          </div>
          <div className="rounded-[24px] bg-card-dark p-4 sm:p-6">
            <h2 className="mb-4 font-display text-xl font-semibold uppercase">¿Qué tenés que arreglar?</h2>
            <SearchBar dark stacked />
            <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div>
                <dt className="text-xs text-muted-light">Verificados</dt>
                <dd className="font-display text-3xl font-bold text-orange">{stats.pros}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-light">Reseñas reales</dt>
                <dd className="font-display text-3xl font-bold text-orange">{stats.reviews}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-light">Promedio</dt>
                <dd className="font-display text-3xl font-bold text-orange">{stats.avg?.toLocaleString("es-AR") ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section aria-labelledby="como-funciona" className="border-b border-border bg-paper-2">
        <div className="container-page py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="como-funciona" className="text-3xl font-bold uppercase sm:text-4xl">Cómo funciona</h2>
            <Link href="/como-funciona" className="inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline">
              Ver en detalle <IconArrowRight size={16} />
            </Link>
          </div>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {STEPS.map((s) => (
              <li key={s.n} className="card p-5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl font-bold text-orange">{s.n}</span>
                  <s.icon className="text-ink" />
                </div>
                <h3 className="mt-3 text-xl font-semibold uppercase">{s.t}</h3>
                <p className="mt-1 text-sm text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="por-que" className="container-page py-16">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-orange-deep">{SITE.value}</p>
        <h2 id="por-que" className="mt-2 text-3xl font-bold uppercase sm:text-4xl">Por qué confiar</h2>
        <p className="mt-3 max-w-2xl text-lg text-muted">La confianza no se promete: se muestra. Por eso cada perfil te enseña lo que verificamos y lo que opinan quienes ya contrataron.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {PILLARS.map((p) => (
            <article key={p.t} className="card flex gap-4 p-6">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange text-ink">
                <p.icon size={24} />
              </span>
              <div>
                <h3 className="text-xl font-semibold uppercase">{p.t}</h3>
                <p className="mt-1 text-muted">{p.d}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="categorias" className="container-page pb-16">
        <h2 id="categorias" className="text-3xl font-bold uppercase sm:text-4xl">Categorías</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link href={`/buscar?categoria=${c.slug}`} className="card group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-ink">
                <CategoryIcon slug={c.slug} size={28} className="text-orange-deep" />
                <span className="mt-3 font-display text-lg font-semibold uppercase leading-tight">{c.name}</span>
                <span className="mt-1 text-sm text-muted">{counts[c.slug] ?? 0} verificados</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/buscar" className="flex h-full flex-col justify-center rounded-[18px] bg-orange p-5 font-display text-lg font-semibold uppercase text-ink hover:bg-[#d4561a]">
              Ver todos <IconArrowRight className="mt-2" />
            </Link>
          </li>
        </ul>
      </section>

      {reviews.length > 0 && (
        <section aria-labelledby="resenas" className="bg-paper-2">
          <div className="container-page py-16">
            <h2 id="resenas" className="text-3xl font-bold uppercase sm:text-4xl">Lo que dicen quienes contrataron</h2>
            <p className="mt-2 text-muted">Reseñas verificadas: cada una corresponde a un trabajo realizado a través de Manny a la Obra.</p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {reviews.map((r) => (
                <figure key={r.id} className="card flex flex-col p-6">
                  <Stars value={r.rating} />
                  <blockquote className="mt-3 flex-1 text-[1.02rem]">“{r.comment}”</blockquote>
                  <figcaption className="mt-4 border-t border-border pt-3 text-sm">
                    <span className="font-semibold">{r.clientName.split(" ")[0]}</span>
                    <span className="text-muted"> contrató a </span>
                    <Link href={`/profesionales/${r.proId}`} className="font-semibold underline">
                      {r.proName}
                    </Link>
                    <span className="text-muted"> · {categoryName(r.category)}</span>
                    <span className="mt-2 flex items-center gap-1 text-xs font-semibold text-success">
                      <IconChat size={14} /> Trabajo real verificado
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container-page py-16">
        <div className="grid gap-8 rounded-[24px] bg-ink p-8 text-paper md:grid-cols-[1.5fr_1fr] md:items-center md:p-12">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-orange">Para profesionales</p>
            <h2 className="mt-2 text-3xl font-bold uppercase sm:text-4xl">Tu trabajo bien hecho, ahora con reputación digital</h2>
            <p className="mt-3 text-muted-light">Conseguí clientes en tu zona, mostrá tus trabajos y destacate con la insignia de verificado. Empezar es gratis.</p>
            <div className="mt-5">
              <VerifiedBadge compact />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <ButtonLink href="/registrarse?rol=profesional">Sumate como profesional</ButtonLink>
            <ButtonLink href="/para-profesionales" variant="onDark">
              Ver beneficios y planes
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
