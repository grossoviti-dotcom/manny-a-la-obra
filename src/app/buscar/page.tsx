import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { z } from "zod";
import { searchProfessionals } from "@/lib/services/search";
import { track } from "@/lib/analytics";
import { getAnonId } from "@/lib/anon";
import { getCurrentUser } from "@/lib/auth/session";
import { CATEGORIES, CATEGORY_SLUGS, ZONES, categoryName } from "@/lib/constants";
import { ProCard } from "@/components/pro-card";
import { EmptyState, btn, cx } from "@/components/ui";
import { IconShieldCheck } from "@/components/icons";

const filtersSchema = z.object({
  categoria: z.enum(CATEGORY_SLUGS).optional().catch(undefined),
  zona: z.enum(ZONES as unknown as [string, ...string[]]).optional().catch(undefined),
  min: z.coerce.number().min(1).max(5).optional().catch(undefined),
  disponible: z.enum(["hoy", "esta_semana"]).optional().catch(undefined),
  precioMax: z.coerce.number().int().positive().optional().catch(undefined),
  orden: z.enum(["calificacion", "precio", "trabajos"]).optional().catch(undefined),
  q: z.string().trim().max(60).optional().catch(undefined),
});

export async function generateMetadata(props: PageProps<"/buscar">): Promise<Metadata> {
  const f = filtersSchema.parse(await props.searchParams);
  const what = f.categoria ? categoryName(f.categoria) : "Profesionales";
  const where = f.zona ? `en ${f.zona}` : "en Rosario";
  return {
    title: `${what} verificados ${where}`,
    description: `Compará ${what.toLowerCase()} verificados ${where}: calificaciones de trabajos reales, precios de referencia y disponibilidad.`,
    alternates: { canonical: `/buscar${f.categoria ? `?categoria=${f.categoria}` : ""}` },
  };
}

export default async function SearchPage(props: PageProps<"/buscar">) {
  const raw = await props.searchParams;
  const f = filtersSchema.parse(raw);
  const [results, user, anonId] = await Promise.all([searchProfessionals(f), getCurrentUser(), getAnonId()]);
  after(() => track("search_performed", { userId: user?.id, anonId, props: { ...f, results: results.length } }));

  const title = `${f.categoria ? categoryName(f.categoria) : "Profesionales"} ${f.zona ? `en ${f.zona}` : "en Rosario y alrededores"}`;
  const activeFilters = Object.values(f).filter(Boolean).length;

  const filters = (p: string) => (
    <form method="get" className="space-y-5" aria-label="Filtros de búsqueda">
      {f.q && <input type="hidden" name="q" value={f.q} />}
      <div>
        <label htmlFor={`${p}-categoria`} className="label">Servicio</label>
        <select id={`${p}-categoria`} name="categoria" defaultValue={f.categoria ?? ""} className="input">
          <option value="">Todos</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${p}-zona`} className="label">Zona</label>
        <select id={`${p}-zona`} name="zona" defaultValue={f.zona ?? ""} className="input">
          <option value="">Todas</option>
          {ZONES.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </div>
      <fieldset>
        <legend className="label">Calificación mínima</legend>
        <div className="flex flex-wrap gap-2">
          {[["", "Todas"], ["4", "4+ ★"], ["4.5", "4,5+ ★"]].map(([v, l]) => (
            <label key={v} className="cursor-pointer">
              <input type="radio" name="min" value={v} defaultChecked={String(f.min ?? "") === v} className="peer sr-only" />
              <span className="inline-block rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-orange">{l}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor={`${p}-disp`} className="label">Disponibilidad</label>
        <select id={`${p}-disp`} name="disponible" defaultValue={f.disponible ?? ""} className="input">
          <option value="">Cualquiera</option>
          <option value="hoy">Disponible hoy</option>
          <option value="esta_semana">Esta semana</option>
        </select>
      </div>
      <div>
        <label htmlFor={`${p}-precio`} className="label">Precio de referencia máximo</label>
        <select id={`${p}-precio`} name="precioMax" defaultValue={f.precioMax ? String(f.precioMax) : ""} className="input">
          <option value="">Sin límite</option>
          {[20000, 25000, 30000, 35000].map((p) => (
            <option key={p} value={p}>Hasta ${p.toLocaleString("es-AR")}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${p}-orden`} className="label">Ordenar por</label>
        <select id={`${p}-orden`} name="orden" defaultValue={f.orden ?? "calificacion"} className="input">
          <option value="calificacion">Mejor calificados</option>
          <option value="precio">Menor precio</option>
          <option value="trabajos">Más trabajos realizados</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button type="submit" className={cx(btn.primary, "flex-1")}>Aplicar filtros</button>
        {activeFilters > 0 && (
          <Link href="/buscar" className={btn.ghost}>Limpiar</Link>
        )}
      </div>
    </form>
  );

  return (
    <div className="container-page py-8 md:py-12">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-orange-deep">Resultados</p>
      <h1 className="mt-1 text-3xl font-bold uppercase sm:text-4xl">{title}</h1>
      <p className="mt-2 flex items-center gap-2 text-muted">
        <IconShieldCheck size={18} className="text-success" />
        {results.length} profesionales verificados. Sólo mostramos perfiles con identidad validada y verificación vigente.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <details className="card group p-4 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">
              Filtrar y ordenar {activeFilters > 0 && `(${activeFilters})`}
              <span aria-hidden className="transition group-open:rotate-180">▾</span>
            </summary>
            <div className="mt-4">{filters("fm")}</div>
          </details>
          <div className="card sticky top-24 hidden p-5 lg:block">
            <h2 className="mb-4 font-display text-lg font-semibold uppercase">Filtros</h2>
            {filters("fd")}
          </div>
        </aside>
        <section aria-label="Lista de profesionales" aria-live="polite">
          {results.length === 0 ? (
            <EmptyState title="No encontramos profesionales con esos filtros">
              Probá ampliar la zona o quitar algún filtro. Estamos sumando profesionales verificados todas las semanas.
            </EmptyState>
          ) : (
            <ul className="space-y-4">
              {results.map((p) => (
                <li key={p.id}>
                  <ProCard pro={p} zona={f.zona} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
