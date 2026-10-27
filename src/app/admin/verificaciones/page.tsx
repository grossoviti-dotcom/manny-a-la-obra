import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { adminVerificationQueue } from "@/lib/services/verification";
import { VERIFICATION_LABEL, categoryName } from "@/lib/constants";
import { EmptyState, StatusBadge, fmtDate } from "@/components/ui";

export const metadata: Metadata = { title: "Admin · Verificaciones", robots: { index: false } };

export default async function VerificationQueue() {
  const user = await requireUser("admin");
  const rows = await adminVerificationQueue({ id: user.id, role: user.role });
  const soon = Date.now() + 30 * 864e5;
  const groups = [
    { title: "En revisión", rows: rows.filter((r) => r.status === "en_revision") },
    { title: "Por vencer (30 días)", rows: rows.filter((r) => r.status === "verificado" && r.expiresAt && r.expiresAt.getTime() < soon) },
    { title: "Pendientes de documentación", rows: rows.filter((r) => r.status === "pendiente") },
    { title: "Rechazados", rows: rows.filter((r) => r.status === "rechazado") },
    { title: "Verificados", rows: rows.filter((r) => r.status === "verificado" && !(r.expiresAt && r.expiresAt.getTime() < soon)) },
  ];
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold uppercase">Cola de verificaciones</h1>
      {groups.map((g) => (
        <section key={g.title} aria-label={g.title}>
          <h2 className="mb-3 font-display text-lg font-semibold uppercase">{g.title} ({g.rows.length})</h2>
          {g.rows.length === 0 ? (
            <EmptyState title="Nada por acá" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted">
                  <tr><th className="p-3">Profesional</th><th className="p-3">Oficio</th><th className="p-3">Enviado</th><th className="p-3">Vence</th><th className="p-3">Estado</th><th className="p-3"><span className="sr-only">Acción</span></th></tr>
                </thead>
                <tbody className="[&_tr]:border-t [&_tr]:border-border">
                  {g.rows.map((r) => (
                    <tr key={r.userId}>
                      <td className="p-3"><span className="font-semibold">{r.name}</span><span className="block text-xs text-muted">{r.email}</span></td>
                      <td className="p-3">{r.tradeTitle || "—"}<span className="block text-xs text-muted">{r.categories.map(categoryName).join(", ")}</span></td>
                      <td className="p-3">{fmtDate(r.submittedAt)}</td>
                      <td className="p-3">{fmtDate(r.expiresAt)}</td>
                      <td className="p-3"><StatusBadge status={r.status} label={VERIFICATION_LABEL[r.status]} /></td>
                      <td className="p-3 text-right"><Link href={`/admin/verificaciones/${r.userId}`} className="font-semibold underline">{r.status === "en_revision" ? "Revisar" : "Ver"}</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
