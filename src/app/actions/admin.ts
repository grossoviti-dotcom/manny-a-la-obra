"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getActor } from "@/lib/auth/session";
import { DomainError, assertRole, toActionError, type ActionState } from "@/lib/errors";
import { adminUpdateClaim } from "@/lib/services/claims";
import { adminApprove, adminReject } from "@/lib/services/verification";
import { moderateReview } from "@/lib/services/reviews";
import { audit } from "@/lib/audit";
import { CLAIM_STATUS_LABEL } from "@/lib/constants";

async function admin() {
  const a = await getActor();
  assertRole(a, "admin");
  return a;
}

export async function updateClaimAction(_: ActionState, form: FormData): Promise<ActionState> {
  const claimId = String(form.get("claimId"));
  try {
    const status = String(form.get("status"));
    if (!(status in CLAIM_STATUS_LABEL)) throw new DomainError("Estado inválido.");
    await adminUpdateClaim(await admin(), claimId, {
      status: status as keyof typeof CLAIM_STATUS_LABEL,
      note: String(form.get("note") ?? ""),
      resolution: String(form.get("resolution") ?? ""),
      internal: form.get("internal") === "on",
    });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath(`/reclamos/${claimId}`);
  revalidatePath("/admin/reclamos");
  return { ok: true, message: "Reclamo actualizado y notificado." };
}

export async function verificationDecisionAction(_: ActionState, form: FormData): Promise<ActionState> {
  const proId = String(form.get("professionalId"));
  try {
    const a = await admin();
    if (form.get("decision") === "aprobar") await adminApprove(a, proId, String(form.get("notes") ?? ""));
    else await adminReject(a, proId, String(form.get("reason") ?? ""), form.getAll("rejectedDocs").map(String));
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/verificaciones");
  revalidatePath(`/admin/verificaciones/${proId}`);
  return { ok: true, message: form.get("decision") === "aprobar" ? "Profesional verificado. Ya aparece en las búsquedas." : "Verificación rechazada y notificada." };
}

export async function moderateReviewAction(form: FormData) {
  const decision = form.get("decision") === "publicada" ? "publicada" : "oculta";
  await moderateReview(await admin(), String(form.get("reviewId")), decision);
  revalidatePath("/admin/resenas");
}

export async function toggleSuspendAction(form: FormData) {
  const a = await admin();
  const userId = String(form.get("userId"));
  if (userId === a.id) throw new DomainError("No podés suspender tu propia cuenta.");
  const [u] = await db.select({ suspended: schema.users.suspended }).from(schema.users).where(eq(schema.users.id, userId));
  if (!u) return;
  await db.update(schema.users).set({ suspended: !u.suspended }).where(eq(schema.users.id, userId));
  await audit(a.id, u.suspended ? "user.reactivate" : "user.suspend", "user", userId);
  revalidatePath("/admin/usuarios");
}
