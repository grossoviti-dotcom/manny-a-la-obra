import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { adminGetVerification, requiredDocs } from "@/lib/services/verification";
import { DomainError } from "@/lib/errors";
import { DOC_TYPE_LABEL, VERIFICATION_LABEL, categoryName } from "@/lib/constants";
import { Notice, StatusBadge, fmtDate } from "@/components/ui";
import { DecisionForm } from "./decision-form";

export const metadata: Metadata = { title: "Admin · Revisar verificación", robots: { index: false } };

export default async function ReviewVerification(props: PageProps<"/admin/verificaciones/[id]">) {
  const { id } = await props.params;
  const user = await requireUser("admin");
  let d: Awaited<ReturnType<typeof adminGetVerification>>;
  try {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    d = await adminGetVerification({ id: user.id, role: user.role }, id);
  } catch (e) {
    if (e instanceof DomainError) notFound();
    throw e;
  }
  const { profile: p, user: u, docs } = d;
  const missing = requiredDocs(p.categories).filter((t) => !docs.some((x) => x.type === t));
  return (
    <div className="space-y-6">
      <Link href="/admin/verificaciones" className="text-sm underline">← Cola de verificaciones</Link>
      <header className="card flex flex-wrap items-start justify-between gap-4 p-6">
        <div>
          <h1 className="text-2xl font-bold uppercase">{u.name}</h1>
          <p className="text-muted">{p.tradeTitle} · {p.categories.map(categoryName).join(", ")}</p>
          <p className="mt-1 text-sm text-muted">{u.email} · {u.phone ?? "sin teléfono"} · Matrícula: {p.licenseNumber ?? "—"} · Ref. proveedor: {p.externalVerificationRef ?? "—"}</p>
        </div>
        <StatusBadge status={p.verificationStatus} label={VERIFICATION_LABEL[p.verificationStatus]} />
      </header>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-6" aria-labelledby="docs">
          <h2 id="docs" className="text-xl font-bold uppercase">Documentación</h2>
          <p className="text-sm text-muted">Archivos privados: sólo visibles para admins y el propio profesional.</p>
          {missing.length > 0 && <div className="mt-3"><Notice tone="error">Faltan: {missing.map((m) => DOC_TYPE_LABEL[m]).join(", ")}</Notice></div>}
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {docs.map((doc) => (
              <li key={doc.id} className="rounded-2xl border border-border p-3">
                <p className="font-semibold">{DOC_TYPE_LABEL[doc.type]}</p>
                <p className="text-xs text-muted">Subido {fmtDate(doc.createdAt)} · {doc.status}</p>
                <a href={`/api/archivos/${doc.fileId}`} target="_blank" rel="noreferrer" className="mt-2 block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/archivos/${doc.fileId}`} alt={`${DOC_TYPE_LABEL[doc.type]} de ${u.name}`} className="h-36 w-full rounded-xl bg-paper-2 object-contain" />
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-border pt-4 text-sm">
            <p className="font-semibold">Perfil declarado</p>
            <p className="mt-1 text-muted">{p.bio || "Sin descripción"}</p>
            <p className="mt-1 text-muted">Zonas: {p.zones.join(", ") || "—"} · {p.yearsExperience} años de experiencia</p>
          </div>
        </section>
        <section className="card h-fit p-6" aria-labelledby="decision">
          <h2 id="decision" className="text-xl font-bold uppercase">Decisión</h2>
          <div className="mt-4">
            {p.verificationStatus === "en_revision" ? (
              <DecisionForm professionalId={u.id} docs={docs.map((x) => ({ id: x.id, type: x.type }))} />
            ) : (
              <p className="text-sm text-muted">
                {p.verificationStatus === "verificado" ? `Verificado el ${fmtDate(p.verifiedAt)}, vence el ${fmtDate(p.verificationExpiresAt)}.` : p.verificationStatus === "rechazado" ? `Rechazado: ${p.rejectionReason}` : "El profesional todavía no envió su documentación."}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
