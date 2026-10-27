import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMetrics, recentEmails } from "@/lib/services/metrics";
import { cx, fmtDateTime } from "@/components/ui";
import { IconCheck, IconAlert } from "@/components/icons";

export const metadata: Metadata = { title: "Admin · Métricas", robots: { index: false } };

function Goal({ label, value, target, unit = "%", help }: { label: string; value: number | null; target: number; unit?: string; help: string }) {
  const ok = value != null && value >= target;
  const pct = value == null ? 0 : Math.min(100, (value / (unit === "%" ? 100 : 5)) * 100);
  const tpct = (target / (unit === "%" ? 100 : 5)) * 100;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{label}</p>
        <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold", ok ? "bg-success/10 text-success" : "bg-orange/15 text-orange-deep")}>
          {ok ? <IconCheck size={14} /> : <IconAlert size={14} />} {ok ? "Meta cumplida" : "Debajo de la meta"}
        </span>
      </div>
      <p className="mt-2 font-display text-4xl font-bold">
        {value == null ? "—" : value.toLocaleString("es-AR")}
        <span className="text-lg text-muted">{unit === "%" ? "%" : " / 5"}</span>
      </p>
      <div className="relative mt-3 h-2 rounded-full bg-paper-2" aria-hidden>
        <div className={cx("h-2 rounded-full", ok ? "bg-success" : "bg-orange")} style={{ width: `${pct}%` }} />
        <div className="absolute -top-1 h-4 w-0.5 bg-ink" style={{ left: `${tpct}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">Meta: ≥ {target.toLocaleString("es-AR")}{unit === "%" ? "%" : ""} · {help}</p>
    </div>
  );
}

export default async function AdminHome() {
  const user = await requireUser("admin");
  const actor = { id: user.id, role: user.role };
  const [m, emails] = await Promise.all([getMetrics(actor), recentEmails(actor)]);
  return (
    <div className="space-y-10">
      <section aria-labelledby="colas">
        <h1 id="colas" className="mb-3 text-2xl font-bold uppercase">Pendientes</h1>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["/admin/verificaciones", "Verificaciones en revisión", m.queues.verifications],
            ["/admin/reclamos", "Reclamos abiertos", m.queues.claims],
            ["/admin/resenas", "Reseñas en moderación", m.queues.reviews],
          ].map(([href, label, n]) => (
            <Link key={href as string} href={href as string} className={cx("rounded-[18px] p-5 transition hover:-translate-y-0.5", Number(n) > 0 ? "bg-ink text-paper" : "card")}>
              <p className={cx("font-display text-4xl font-bold", Number(n) > 0 && "text-orange")}>{n}</p>
              <p className="mt-1 font-semibold">{label} →</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="metas">
        <h2 id="metas" className="mb-3 text-2xl font-bold uppercase">Metas del MVP</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Goal label="Profesionales que completan la verificación" value={m.goals.verificationRate.value} target={60} help={`${m.pros.verified} verificados de ${m.pros.started} altas`} />
          <Goal label="Búsquedas que derivan en pedido" value={m.goals.searchToRequest.value} target={30} help={`${m.funnel.searchersWithRequest} de ${m.funnel.searchers} visitantes que buscaron`} />
          <Goal label="Pedidos que terminan en contratación" value={m.goals.requestToHire.value} target={20} help={`${m.funnel.hired} contrataciones de ${m.funnel.requests} pedidos`} />
          <Goal label="Calificación promedio" value={m.goals.avgRating.value} target={4.5} unit="/5" help={`${m.rating.n} reseñas publicadas`} />
        </div>
      </section>

      <section aria-labelledby="indicadores">
        <h2 id="indicadores" className="mb-3 text-2xl font-bold uppercase">Indicadores</h2>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Usuarios registrados", m.users.total, `${m.users.clientes} clientes · ${m.users.profesionales} profesionales`],
            ["Profesionales verificados", m.pros.verified, `${m.pros.expiring} vencen en 30 días`],
            ["Solicitudes de servicio", m.funnel.requests, `${m.funnel.searches} búsquedas registradas`],
            ["Tiempo hasta contratar", m.time.hoursToHire != null ? `${m.time.hoursToHire.toLocaleString("es-AR")} h` : "—", "Promedio desde el pedido"],
            ["Reclamos abiertos", m.claims.open, `${m.claims.total} en total`],
            ["Tiempo de resolución", m.claims.avgResolutionHours != null ? `${m.claims.avgResolutionHours.toLocaleString("es-AR")} h` : "—", "Promedio de reclamos cerrados"],
            ["Concretadas en la plataforma", m.inPlatformRate != null ? `${m.inPlatformRate.toLocaleString("es-AR")}%` : "—", `${m.jobs.finished} finalizados de ${m.jobs.hired} contratados`],
            ["Reseñas marcadas", m.rating.flagged, "Sospechosas o denunciadas"],
          ].map(([l, v, h]) => (
            <div key={l as string} className="card p-5">
              <dt className="text-sm text-muted">{l}</dt>
              <dd className="font-display text-3xl font-bold">{v}</dd>
              <dd className="text-xs text-muted">{h}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-muted">Incluye {m.users.demo} cuentas de demostración.</p>
      </section>

      <section aria-labelledby="emails">
        <h2 id="emails" className="mb-3 text-2xl font-bold uppercase">Últimos emails (adaptador mock)</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="p-3">Para</th><th className="p-3">Asunto</th><th className="p-3">Fecha</th></tr></thead>
            <tbody className="[&_tr]:border-t [&_tr]:border-border">
              {emails.map((e, i) => (
                <tr key={i}><td className="p-3">{e.to}</td><td className="p-3">{e.subject}</td><td className="p-3 text-muted">{fmtDateTime(e.createdAt)}</td></tr>
              ))}
              {emails.length === 0 && <tr><td colSpan={3} className="p-3 text-muted">Sin emails todavía.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
