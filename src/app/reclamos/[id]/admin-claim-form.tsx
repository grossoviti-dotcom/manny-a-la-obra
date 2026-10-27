"use client";

import { useActionState, useState } from "react";
import { updateClaimAction } from "@/app/actions/admin";
import { FormMessage, SubmitButton } from "@/components/form";
import { CLAIM_STATUS_LABEL } from "@/lib/constants";

const NEXT: Record<string, string[]> = { abierto: ["en_mediacion", "cerrado"], en_mediacion: ["en_mediacion", "resuelto", "cerrado"] };

export function AdminClaimForm({ claimId, status }: { claimId: string; status: string }) {
  const [state, action] = useActionState(updateClaimAction, {});
  const options = NEXT[status] ?? [];
  const [next, setNext] = useState(options[0]);
  if (!options.length) return <p className="text-sm text-muted">El reclamo está cerrado.</p>;
  const closing = next === "resuelto" || next === "cerrado";
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="claimId" value={claimId} />
      <FormMessage state={state} />
      <div>
        <label htmlFor="status" className="label">Nuevo estado</label>
        <select id="status" name="status" value={next} onChange={(e) => setNext(e.target.value)} className="input">
          {options.map((o) => (
            <option key={o} value={o}>{o === status ? `${CLAIM_STATUS_LABEL[o as keyof typeof CLAIM_STATUS_LABEL]} (agregar nota)` : CLAIM_STATUS_LABEL[o as keyof typeof CLAIM_STATUS_LABEL]}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="note" className="label">Nota de seguimiento</label>
        <textarea id="note" name="note" rows={3} className="input" placeholder="Qué se hizo / qué sigue" />
      </div>
      {closing && (
        <div>
          <label htmlFor="resolution" className="label">Resolución registrada</label>
          <textarea id="resolution" name="resolution" rows={3} className="input" placeholder="Acuerdo alcanzado o dictamen" />
        </div>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="internal" className="size-4" /> Nota interna (no visible para el cliente)
      </label>
      <SubmitButton pendingText="Guardando…">Guardar</SubmitButton>
    </form>
  );
}
