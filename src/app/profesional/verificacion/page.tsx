import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getOwnProfile, listOwnDocuments, requiredDocs } from "@/lib/services/verification";
import { DOC_TYPE_LABEL, VERIFICATION_LABEL } from "@/lib/constants";
import { Notice, StatusBadge, fmtDate } from "@/components/ui";
import { IconCheck, IconFile, IconLock } from "@/components/icons";
import { DocUploadForm, SubmitVerificationForm } from "./forms";

export const metadata: Metadata = { title: "Verificación", robots: { index: false } };

const HELP: Record<string, string> = {
  dni_frente: "Foto nítida del frente, con los 4 bordes visibles.",
  dni_dorso: "Foto nítida del dorso, sin reflejos.",
  selfie: "Una foto tuya sosteniendo el DNI junto a tu cara.",
  matricula: "Credencial o certificado de matrícula vigente.",
};

export default async function VerificationPage() {
  const user = await requireUser("profesional");
  const actor = { id: user.id, role: user.role };
  const [p, docs] = await Promise.all([getOwnProfile(actor), listOwnDocuments(actor)]);
  const required = requiredDocs(p.categories);
  const profileReady = !!p.tradeTitle && p.categories.length > 0 && p.zones.length > 0 && p.bio.length >= 30;
  const docsReady = required.every((t) => docs.some((d) => d.type === t));
  const locked = p.verificationStatus === "en_revision";
  const vigente = p.verificationStatus === "verificado" && p.verificationExpiresAt && p.verificationExpiresAt > new Date();
  const canSubmit = !locked && !vigente;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold uppercase">Verificación</h1>
          <StatusBadge status={p.verificationStatus} label={VERIFICATION_LABEL[p.verificationStatus]} />
        </div>
        <div className="mt-4 space-y-3">
          {p.verificationStatus === "pendiente" && <Notice>Subí tu documentación y enviala a revisión. Hasta que te verifiquemos, tu perfil no aparece en las búsquedas.</Notice>}
          {locked && <Notice tone="warn">Recibimos tu documentación el {fmtDate(p.verificationSubmittedAt)}. La revisamos en 24 a 72 h hábiles.</Notice>}
          {p.verificationStatus === "rechazado" && <Notice tone="error"><strong>Necesitamos que corrijas algo:</strong> {p.rejectionReason}</Notice>}
          {vigente && <Notice tone="success">Estás verificado desde el {fmtDate(p.verifiedAt)}. Vence el {fmtDate(p.verificationExpiresAt)}: te avisaremos para revalidar.</Notice>}
          {p.verificationStatus === "verificado" && !vigente && <Notice tone="warn">Tu verificación venció. Subí la documentación actualizada para volver a aparecer en las búsquedas.</Notice>}
        </div>

        <ul className="mt-6 space-y-4">
          {required.map((t) => {
            const doc = docs.find((d) => d.type === t);
            return (
              <li key={t} className="rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 font-semibold">
                      {doc ? <IconCheck size={18} className="text-success" /> : <IconFile size={18} className="text-muted" />}
                      {DOC_TYPE_LABEL[t]}
                    </p>
                    <p className="text-sm text-muted">{HELP[t]}</p>
                  </div>
                  {doc && (
                    <div className="flex items-center gap-2 text-sm">
                      <StatusBadge status={doc.status === "aprobado" ? "verificado" : doc.status === "rechazado" ? "rechazado" : "pendiente"} label={doc.status === "aprobado" ? "Aprobado" : doc.status === "rechazado" ? "Rechazado" : "Subido"} />
                      <a href={`/api/archivos/${doc.fileId}`} target="_blank" rel="noreferrer" className="font-semibold underline">Ver</a>
                    </div>
                  )}
                </div>
                {doc?.adminNotes && <p className="mt-2 text-sm text-danger">Nota del equipo: {doc.adminNotes}</p>}
                {canSubmit && <div className="mt-3"><DocUploadForm type={t} label={DOC_TYPE_LABEL[t]} hasDoc={!!doc} disabled={locked} /></div>}
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="space-y-4">
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold uppercase">Checklist</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex gap-2">{profileReady ? <IconCheck size={18} className="text-success" /> : <span aria-hidden className="w-[18px] text-center">○</span>} Perfil completo {!profileReady && <Link href="/profesional/perfil" className="underline">(completar)</Link>}</li>
            <li className="flex gap-2">{docsReady ? <IconCheck size={18} className="text-success" /> : <span aria-hidden className="w-[18px] text-center">○</span>} Documentos obligatorios</li>
            {required.includes("matricula") && (
              <li className="flex gap-2">{p.licenseNumber ? <IconCheck size={18} className="text-success" /> : <span aria-hidden className="w-[18px] text-center">○</span>} N° de matrícula en el perfil</li>
            )}
          </ul>
          {canSubmit && <div className="mt-5"><SubmitVerificationForm ready={profileReady && docsReady} /></div>}
        </div>
        <div className="card-alt flex gap-3 p-5 text-sm">
          <IconLock className="mt-0.5 shrink-0" />
          <p className="text-muted">Tus documentos sólo los ves vos y el equipo de verificación. Nunca se muestran en tu perfil público. Formatos: JPG, PNG, WEBP o PDF, hasta 5 MB.</p>
        </div>
      </aside>
    </div>
  );
}
