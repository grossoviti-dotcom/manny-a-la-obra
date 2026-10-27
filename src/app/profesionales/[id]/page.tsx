import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { getPublicProfile } from "@/lib/services/search";
import { track } from "@/lib/analytics";
import { getAnonId } from "@/lib/anon";
import { AVAILABILITY_LABEL, categoryName } from "@/lib/constants";
import { Avatar, ButtonLink, Chip, EmptyState, PRICE_UNIT, Stars, VerifiedBadge, fmtDate, money } from "@/components/ui";
import { IconCheck, IconClock, IconMapPin, IconShieldCheck } from "@/components/icons";

export async function generateMetadata(props: PageProps<"/profesionales/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const pro = await getPublicProfile(id);
  if (!pro) return { title: "Profesional no encontrado" };
  return {
    title: `${pro.name} · ${pro.tradeTitle} verificado en Rosario`,
    description: `${pro.tradeTitle} con ${pro.yearsExperience} años de experiencia. ${pro.rating ? `${pro.rating}/5 en ${pro.reviewCount} reseñas de trabajos reales.` : ""} Zonas: ${pro.zones.slice(0, 4).join(", ")}.`,
    alternates: { canonical: `/profesionales/${id}` },
  };
}

export default async function ProfilePage(props: PageProps<"/profesionales/[id]">) {
  const { id } = await props.params;
  const pro = await getPublicProfile(id);
  if (!pro) notFound();
  const anonId = await getAnonId();
  after(() => track("profile_viewed", { anonId, props: { professionalId: id } }));

  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: pro.reviews.filter((r) => r.rating === n).length }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: pro.name,
    description: pro.bio,
    areaServed: pro.zones.map((z) => ({ "@type": "Place", name: `${z}, Rosario` })),
    ...(pro.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: pro.rating, reviewCount: pro.reviewCount } } : {}),
  };

  return (
    <div className="container-page py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-muted">
        <Link href="/buscar" className="underline">Profesionales</Link>
        <span aria-hidden> / </span>
        <Link href={`/buscar?categoria=${pro.categories[0]}`} className="underline">{categoryName(pro.categories[0])}</Link>
        <span aria-hidden> / </span>
        <span aria-current="page">{pro.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section className="card p-6">
            <div className="flex flex-col gap-5 sm:flex-row">
              <Avatar name={pro.name} fileId={pro.avatarFileId} size={104} />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold uppercase sm:text-4xl">{pro.name}</h1>
                </div>
                <p className="text-lg font-medium text-muted">{pro.tradeTitle}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <VerifiedBadge date={pro.verifiedAt} />
                  {pro.plan === "premium" && <Chip className="!border-orange !bg-orange/10">Destacado</Chip>}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  <span className="inline-flex items-center gap-2">
                    <Stars value={pro.rating} size={18} />
                    <strong className="font-display text-xl">{pro.rating?.toLocaleString("es-AR") ?? "—"}</strong>
                    <span className="text-muted">({pro.reviewCount} reseñas)</span>
                  </span>
                  <span>
                    <strong className="font-display text-xl">{pro.jobsDone}</strong> <span className="text-muted">trabajos en la plataforma</span>
                  </span>
                  <span>
                    <strong className="font-display text-xl">{pro.yearsExperience}</strong> <span className="text-muted">años de experiencia</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 border-t border-border pt-6">
              <h2 className="font-display text-lg font-semibold uppercase">Sobre su trabajo</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed">{pro.bio}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {pro.categories.map((c) => (
                  <Chip key={c}>{categoryName(c)}</Chip>
                ))}
              </div>
            </div>
          </section>

          <section aria-labelledby="resenas" className="card p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 id="resenas" className="text-2xl font-bold uppercase">Reseñas</h2>
              <Link href="/legal/resenas" className="text-sm underline">Cómo funcionan las reseñas</Link>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <IconCheck size={16} className="text-success" /> Todas provienen de clientes que contrataron y finalizaron el trabajo en Manny a la Obra.
            </p>
            {pro.reviews.length > 0 && (
              <dl className="mt-5 grid max-w-md gap-1.5">
                {dist.map((d) => (
                  <div key={d.n} className="flex items-center gap-3 text-sm">
                    <dt className="w-16 shrink-0">{d.n} estrellas</dt>
                    <dd className="flex flex-1 items-center gap-2">
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper-2">
                        <span className="block h-full rounded-full bg-orange" style={{ width: `${(d.c / pro.reviews.length) * 100}%` }} />
                      </span>
                      <span className="w-6 text-right text-muted">{d.c}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {pro.reviews.length === 0 ? (
              <div className="mt-5">
                <EmptyState title="Todavía sin reseñas">Este profesional es nuevo en la plataforma.</EmptyState>
              </div>
            ) : (
              <ul className="mt-6 divide-y divide-border">
                {pro.reviews.map((r) => (
                  <li key={r.id} className="py-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Stars value={r.rating} />
                        <span className="font-semibold">{r.clientName.split(" ")[0]} {r.clientName.split(" ")[1]?.[0]}.</span>
                      </div>
                      <span className="text-sm text-muted">{fmtDate(r.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      Trabajo: {r.jobTitle} · {categoryName(r.category)}
                    </p>
                    <p className="mt-2">{r.comment}</p>
                    {r.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.tags.map((t) => (
                          <Chip key={t} className="!py-0.5 text-xs">{t}</Chip>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {pro.recentJobs.length > 0 && (
            <section aria-labelledby="trabajos" className="card p-6">
              <h2 id="trabajos" className="text-2xl font-bold uppercase">Trabajos realizados</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {pro.recentJobs.map((j, i) => (
                  <li key={i} className="card-alt p-4">
                    <p className="font-semibold">{j.title}</p>
                    <p className="text-sm text-muted">{categoryName(j.category)} · {j.zone} · {fmtDate(j.finishedAt, { month: "long", year: "numeric" })}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Precio de referencia</p>
            <p className="font-display text-3xl font-bold">
              <span className="text-base font-normal text-muted">desde </span>
              {money(pro.referencePrice)}
            </p>
            <p className="text-sm text-muted">{PRICE_UNIT[pro.priceUnit]} · el precio final se acuerda en el presupuesto</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2"><IconClock size={18} /> {AVAILABILITY_LABEL[pro.availability]}</li>
              <li className="flex items-start gap-2"><IconMapPin size={18} className="mt-0.5 shrink-0" /> {pro.zones.join(", ")}</li>
            </ul>
            <ButtonLink href={`/pedir-presupuesto?pro=${pro.id}`} className="mt-5 w-full">
              Pedir presupuesto
            </ButtonLink>
            <p className="mt-2 text-center text-xs text-muted">Gratis y sin compromiso.</p>
          </div>
          <div className="card-alt p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold uppercase">
              <IconShieldCheck className="text-success" /> Qué verificamos
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex gap-2"><IconCheck size={18} className="shrink-0 text-success" /> Identidad (DNI frente y dorso)</li>
              <li className="flex gap-2"><IconCheck size={18} className="shrink-0 text-success" /> Validación con selfie</li>
              {pro.hasLicense && <li className="flex gap-2"><IconCheck size={18} className="shrink-0 text-success" /> Matrícula profesional</li>}
              <li className="flex gap-2"><IconCheck size={18} className="shrink-0 text-success" /> Verificado el {fmtDate(pro.verifiedAt)} · vigente hasta {fmtDate(pro.verificationExpiresAt)}</li>
            </ul>
            <Link href="/seguridad" className="mt-3 inline-block text-sm font-semibold underline">Más sobre la verificación</Link>
          </div>
          <p className="px-2 text-xs text-muted">Miembro desde {fmtDate(pro.memberSince, { month: "long", year: "numeric" })}. {pro.isDemo && "Perfil de demostración."}</p>
        </aside>
      </div>
    </div>
  );
}
