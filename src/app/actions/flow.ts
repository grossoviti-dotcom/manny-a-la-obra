"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/auth/session";
import { getAnonId } from "@/lib/anon";
import { DomainError, toActionError, type ActionState } from "@/lib/errors";
import { saveUploads } from "@/lib/services/files";
import * as flow from "@/lib/services/requests";
import { createReview, reportReview } from "@/lib/services/reviews";
import { openClaim } from "@/lib/services/claims";

async function actor() {
  const a = await getActor();
  if (!a) throw new DomainError("Tu sesión expiró. Volvé a ingresar.", "forbidden");
  return a;
}

const files = (form: FormData, name: string) => form.getAll(name).filter((f): f is File => f instanceof File && f.size > 0);

export async function createRequestAction(_: ActionState, form: FormData): Promise<ActionState> {
  let id: string;
  try {
    const a = await actor();
    const photoIds = await saveUploads(a.id, "pedido", files(form, "photos"));
    id = await flow.createRequest(
      a,
      {
        categorySlug: String(form.get("categorySlug") ?? "") as never,
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
        zone: String(form.get("zone") ?? ""),
        urgency: String(form.get("urgency") ?? "media") as never,
        desiredDate: String(form.get("desiredDate") ?? ""),
        professionalIds: form.getAll("professionalIds").map(String),
      },
      photoIds,
      (await getAnonId()) ?? undefined,
    );
  } catch (e) {
    return toActionError(e);
  }
  redirect(`/pedidos/${id}?enviado=1`);
}

/** Envuelve acciones simples ligadas a un pedido y revalida su página. */
async function run(requestId: string, fn: () => Promise<unknown>, okMessage?: string): Promise<ActionState> {
  try {
    await fn();
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath(`/pedidos/${requestId}`);
  return { ok: true, message: okMessage };
}

export async function respondQuoteAction(_: ActionState, form: FormData): Promise<ActionState> {
  const requestId = String(form.get("requestId"));
  return run(
    requestId,
    async () =>
      flow.respondQuote(await actor(), String(form.get("quoteId")), {
        price: form.get("price") as string,
        durationText: String(form.get("durationText") ?? ""),
        availableFrom: String(form.get("availableFrom") ?? ""),
        message: String(form.get("message") ?? ""),
      }),
    "Presupuesto enviado. Te avisamos si el cliente te contrata.",
  );
}

export async function declineQuoteAction(form: FormData) {
  await flow.declineQuote((await actor()), String(form.get("quoteId")));
  revalidatePath(`/pedidos/${form.get("requestId")}`);
  revalidatePath("/profesional");
}

export async function hireAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(String(form.get("requestId")), async () => flow.hireQuote(await actor(), String(form.get("quoteId"))), "¡Listo! Contrataste el servicio. Coordiná los detalles por el chat.");
}

export async function jobTransitionAction(_: ActionState, form: FormData): Promise<ActionState> {
  const op = form.get("op");
  return run(String(form.get("requestId")), async () => {
    const a = await actor();
    const jobId = String(form.get("jobId"));
    if (op === "start") return flow.startJob(a, jobId);
    if (op === "finish") return flow.finishJob(a, jobId);
    throw new DomainError("Operación inválida.");
  });
}

export async function cancelRequestAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(String(form.get("requestId")), async () => flow.cancelRequest(await actor(), String(form.get("requestId"))), "Pedido cancelado.");
}

export async function sendMessageAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(String(form.get("requestId")), async () =>
    flow.sendMessage(await actor(), String(form.get("requestId")), String(form.get("professionalId")), { body: String(form.get("body") ?? "") }),
  );
}

export async function reviewAction(_: ActionState, form: FormData): Promise<ActionState> {
  let flagged = false;
  const res = await run(String(form.get("requestId")), async () => {
    const r = await createReview(await actor(), String(form.get("jobId")), {
      rating: form.get("rating") as string,
      comment: String(form.get("comment") ?? ""),
      tags: form.getAll("tags").map(String) as never,
    });
    flagged = r.flagged;
  });
  if (res.ok)
    return {
      ok: true,
      message: flagged ? "Gracias. Tu reseña quedó en revisión y se publicará cuando la apruebe el equipo." : "¡Gracias! Tu reseña ya está publicada en el perfil.",
    };
  return res;
}

export async function openClaimAction(_: ActionState, form: FormData): Promise<ActionState> {
  let claimId: string;
  try {
    const a = await actor();
    const photoIds = await saveUploads(a.id, "reclamo", files(form, "photos"));
    claimId = await openClaim(a, String(form.get("jobId")), { reason: String(form.get("reason")) as never, description: String(form.get("description") ?? "") }, photoIds);
  } catch (e) {
    return toActionError(e);
  }
  redirect(`/reclamos/${claimId}?nuevo=1`);
}

export async function reportReviewAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    await reportReview(await actor(), String(form.get("reviewId")), String(form.get("reason") ?? ""));
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/profesional");
  return { ok: true, message: "Recibimos tu denuncia. El equipo la va a revisar." };
}
