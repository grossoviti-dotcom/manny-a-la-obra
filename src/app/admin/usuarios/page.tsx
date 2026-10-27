import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listUsers } from "@/lib/services/metrics";
import { toggleSuspendAction } from "@/app/actions/admin";
import { StatusBadge, fmtDate } from "@/components/ui";
import { VERIFICATION_LABEL } from "@/lib/constants";

export const metadata: Metadata = { title: "Admin · Usuarios", robots: { index: false } };

export default async function UsersPage() {
  const user = await requireUser("admin");
  const rows = await listUsers({ id: user.id, role: user.role });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold uppercase">Usuarios y profesionales ({rows.length})</h1>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr><th className="p-3">Nombre</th><th className="p-3">Rol</th><th className="p-3">Verificación</th><th className="p-3">Plan</th><th className="p-3">Alta</th><th className="p-3">Cuenta</th></tr>
          </thead>
          <tbody className="[&_tr]:border-t [&_tr]:border-border">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="p-3">
                  {u.role === "profesional" ? <Link href={`/admin/verificaciones/${u.id}`} className="font-semibold underline">{u.name}</Link> : <span className="font-semibold">{u.name}</span>}
                  <span className="block text-xs text-muted">{u.email}{u.isDemo && " · demo"}</span>
                </td>
                <td className="p-3 capitalize">{u.role}</td>
                <td className="p-3">{u.verificationStatus ? <StatusBadge status={u.verificationStatus} label={VERIFICATION_LABEL[u.verificationStatus as keyof typeof VERIFICATION_LABEL]} /> : "—"}</td>
                <td className="p-3 capitalize">{u.plan ?? "—"}</td>
                <td className="p-3">{fmtDate(u.createdAt)}</td>
                <td className="p-3">
                  {u.role !== "admin" && (
                    <form action={toggleSuspendAction} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <span className={u.suspended ? "font-semibold text-danger" : "text-success"}>{u.suspended ? "Suspendida" : "Activa"}</span>
                      <button className="text-xs font-semibold underline">{u.suspended ? "Reactivar" : "Suspender"}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
