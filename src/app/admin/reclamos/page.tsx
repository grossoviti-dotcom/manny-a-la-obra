import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listClaims } from "@/lib/services/claims";
import { CLAIM_REASON_LABEL, CLAIM_STATUS_LABEL } from "@/lib/constants";
import { EmptyState, StatusBadge, fmtDate } from "@/components/ui";

export const metadata: Metadata = { title: "Admin · Reclamos", robots: { index: false } };

export default async function ClaimsQueue() {
  const user = await requireUser("admin");
  const rows = await listClaims({ id: user.id, role: user.role });
  const open = rows.filter((r) => r.claim.status === "abierto" || r.claim.status === "en_mediacion");
  const closed = rows.filter((r) => !open.includes(r));
  const table = (list: typeof rows) =>
    list.length === 0 ? (
      <EmptyState title="Nada por acá" />
    ) : (
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr><th className="p-3">Trabajo</th><th className="p-3">Cliente</th><th className="p-3">Motivo</th><th className="p-3">Abierto</th><th className="p-3">Estado</th><th className="p-3"><span className="sr-only">Acción</span></th></tr>
          </thead>
          <tbody className="[&_tr]:border-t [&_tr]:border-border">
            {list.map((r) => (
              <tr key={r.claim.id}>
                <td className="p-3 font-semibold">{r.title}</td>
                <td className="p-3">{r.clientName}</td>
                <td className="p-3">{CLAIM_REASON_LABEL[r.claim.reason]}</td>
                <td className="p-3">{fmtDate(r.claim.createdAt)}</td>
                <td className="p-3"><StatusBadge status={r.claim.status} label={CLAIM_STATUS_LABEL[r.claim.status]} /></td>
                <td className="p-3 text-right"><Link href={`/reclamos/${r.claim.id}`} className="font-semibold underline">Gestionar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold uppercase">Reclamos</h1>
      <section aria-label="Abiertos"><h2 className="mb-3 font-display text-lg font-semibold uppercase">Abiertos y en mediación ({open.length})</h2>{table(open)}</section>
      <section aria-label="Cerrados"><h2 className="mb-3 font-display text-lg font-semibold uppercase">Resueltos y cerrados ({closed.length})</h2>{table(closed)}</section>
    </div>
  );
}
