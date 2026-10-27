"use client";

import { useActionState } from "react";
import { reportReviewAction } from "@/app/actions/flow";
import { FormMessage, SubmitButton } from "@/components/form";

export function ReportReviewForm({ reviewId }: { reviewId: string }) {
  const [state, action] = useActionState(reportReviewAction, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer text-muted underline">Denunciar reseña</summary>
      <form action={action} className="mt-2 space-y-2">
        <input type="hidden" name="reviewId" value={reviewId} />
        <label htmlFor={`rr-${reviewId}`} className="sr-only">Motivo</label>
        <textarea id={`rr-${reviewId}`} name="reason" rows={2} className="input" placeholder="¿Por qué creés que no cumple la política?" />
        <FormMessage state={state} />
        <SubmitButton variant="secondary" className="!min-h-9 !py-1 !text-sm">Enviar denuncia</SubmitButton>
      </form>
    </details>
  );
}
