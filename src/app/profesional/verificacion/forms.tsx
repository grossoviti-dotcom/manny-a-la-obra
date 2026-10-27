"use client";

import { useActionState } from "react";
import { submitVerificationAction, uploadDocumentAction } from "@/app/actions/pro";
import { FormMessage, SubmitButton } from "@/components/form";

export function DocUploadForm({ type, label, hasDoc, disabled }: { type: string; label: string; hasDoc: boolean; disabled: boolean }) {
  const [state, action] = useActionState(uploadDocumentAction, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="type" value={type} />
      <label htmlFor={`doc-${type}`} className="sr-only">{label}</label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input id={`doc-${type}`} name="file" type="file" required disabled={disabled} accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-paper-2 file:px-4 file:py-2 file:font-semibold" />
        <SubmitButton variant="secondary" className="!min-h-9 shrink-0 !px-4 !py-1.5 !text-sm" pendingText="Subiendo…">{hasDoc ? "Reemplazar" : "Subir"}</SubmitButton>
      </div>
      {(state.error || state.message) && <FormMessage state={state} />}
    </form>
  );
}

export function SubmitVerificationForm({ ready }: { ready: boolean }) {
  const [state, action] = useActionState(submitVerificationAction, {});
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      {!state.ok && <SubmitButton className="w-full" pendingText="Enviando…">{ready ? "Enviar a revisión" : "Enviar a revisión (faltan datos)"}</SubmitButton>}
    </form>
  );
}
