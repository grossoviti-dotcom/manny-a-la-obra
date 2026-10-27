import { db, schema } from "@/db";

/**
 * Eventos de producto para medir las metas del MVP:
 * - pro_signup_started / pro_verification_submitted / pro_verified → % de verificación
 * - search_performed / quote_request_created → % búsquedas que derivan en pedido
 * - quote_request_created / job_hired → % pedidos que terminan en contratación
 * - review_created (rating) → calificación promedio
 */
export type AnalyticsEvent =
  | "search_performed"
  | "profile_viewed"
  | "quote_request_created"
  | "quote_sent"
  | "job_hired"
  | "job_finished"
  | "review_created"
  | "claim_opened"
  | "claim_resolved"
  | "user_registered"
  | "pro_signup_started"
  | "pro_verification_submitted"
  | "pro_verified";

export async function track(
  name: AnalyticsEvent,
  opts: { userId?: string | null; anonId?: string | null; props?: Record<string, unknown> } = {},
) {
  try {
    await db.insert(schema.analyticsEvents).values({
      name,
      userId: opts.userId ?? null,
      anonId: opts.anonId ?? null,
      props: opts.props,
    });
  } catch (e) {
    console.error("[analytics] no se pudo registrar", name, e);
  }
}
