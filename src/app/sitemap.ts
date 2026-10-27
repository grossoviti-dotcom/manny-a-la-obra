import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { visibleProfessional } from "@/lib/services/search";
import { CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const statics = ["", "/buscar", "/como-funciona", "/garantia", "/seguridad", "/para-profesionales", "/ayuda", "/sobre-nosotros", "/legal/terminos", "/legal/privacidad", "/legal/resenas", "/legal/reclamos"];
  const pros = await db
    .select({ id: schema.professionalProfiles.userId })
    .from(schema.professionalProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.professionalProfiles.userId))
    .where(visibleProfessional());
  return [
    ...statics.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...CATEGORIES.map((c) => ({ url: `${base}/buscar?categoria=${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...pros.map((p) => ({ url: `${base}/profesionales/${p.id}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
