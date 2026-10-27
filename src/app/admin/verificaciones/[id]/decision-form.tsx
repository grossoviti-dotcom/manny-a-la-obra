"use client";

import { useActionState, useState } from "react";
import { verificationDecisionAction } from "@/app/actions/admin";
import { FormMessage, SubmitButton } from "@/components/form";
import { DOC_TYPE_LABEL } from "@/lib/constants";

export function DecisionForm({ professionalId, docs }: { professionalId: string; docs: { id: string; type: keyof typeof DOC_TYPE_LABEL }[] }) {
  const [state, action] = useActionState(verificationDecisionAction, {});
  const [decision, setDecision] = useState<"aprobar" | "rechazar">("aprobar");
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="professionalId" value={professionalId} />
      <FormMessage state={state} />
      <fieldset className="flex gap-2">
        <legend className="label">Decisión</legend>
        {(["aprobar", "rechazar"] as const).map((d) => (
          <label key={d} className="cursor-pointer">
            <input type="radio" name="decision" value={d} checked={decision === d} onChange={() => setDecision(d)} className="peer sr-only" />
            <span className="inline-block rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold capitalize peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-orange">{d}</span>
          </label>
        ))}
      </fieldset>
      {decision === "aprobar" ? (
        <div>
          <label htmlFor="notes" className="label">Notas internas <span className="font-normal text-muted">(opcional)</span></label>
          <textarea id="notes" name="notes" rows={2} className="input" />
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="reason" className="label">Motivo (se le envía al profesional)</label>
            <textarea id="reason" name="reason" rows={3} className="input" placeholder="Ej.: La foto del DNI está borrosa. Subila de nuevo con buena luz." />
          </div>
          <fieldset>
            <legend className="label">Documentos a corregir</legend>
            {docs.map((d) => (
              <label key={d.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="rejectedDocs" value={d.id} className="size-4" /> {DOC_TYPE_LABEL[d.type]}
              </label>
            ))}
          </fieldset>
        </>
      )}
      <SubmitButton variant={decision === "aprobar" ? "primary" : "danger"} pendingText="Guardando…">
        {decision === "aprobar" ? "Aprobar y publicar perfil" : "Rechazar verificación"}
      </SubmitButton>
    </form>
  );
}
