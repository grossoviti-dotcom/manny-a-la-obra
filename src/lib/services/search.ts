import { and, eq, gt, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";

const p = schema.professionalProfiles;
const u = schema.users;

/** Profesional visible = verificado, con verificación vigente y cuenta activa. */
export const visibleProfessional = () =>
  and(eq(p.verificationStatus, "verificado"), gt(p.verificationExpiresAt, sql`now()`), eq(u.suspended, false))!;

const ratingAvg = sql<number | null>`(select round(avg(r.rating)::numeric, 1)::float from reviews r where r.professional_id = ${p.userId} and r.moderation_status = 'publicada')`;
const reviewCount = sql<number>`(select count(*)::int from reviews r where r.professional_id = ${p.userId} and r.moderation_status = 'publicada')`;
const jobsDone = sql<number>`(select count(*)::int from jobs j where j.professional_id = ${p.userId} and j.finished_at is not null)`;

export type SearchFilters = {
  q?: string;
  categoria?: string;
  zona?: string;
  min?: number;
  disponible?: "hoy" | "esta_semana";
  precioMax?: number;
  orden?: "calificacion" | "precio" | "trabajos";
};

export async function searchProfessionals(f: SearchFilters) {
  const conds: SQL[] = [visibleProfessional()];
  if (f.categoria) conds.push(sql`${f.categoria} = any(${p.categories})`);
  if (f.zona) conds.push(sql`${f.zona} = any(${p.zones})`);
  if (f.disponible === "hoy") conds.push(eq(p.availability, "hoy"));
  if (f.disponible === "esta_semana") conds.push(sql`${p.availability} in ('hoy','esta_semana')`);
  if (f.precioMax) conds.push(sql`${p.referencePrice} <= ${f.precioMax}`);
  if (f.min) conds.push(sql`coalesce(${ratingAvg}, 0) >= ${f.min}`);
  if (f.q) {
    const like = `%${f.q.toLowerCase()}%`;
    conds.push(
      sql`(lower(${p.tradeTitle}) like ${like} or lower(${u.name}) like ${like} or lower(${p.bio}) like ${like} or exists (select 1 from categories c where c.slug = any(${p.categories}) and lower(c.name) like ${like}))`,
    );
  }

  const order =
    f.orden === "precio"
      ? [sql`${p.referencePrice} asc nulls last`]
      : f.orden === "trabajos"
        ? [sql`${jobsDone} desc`, sql`${ratingAvg} desc nulls last`]
        : // Premium tiene más visibilidad: desempata a igual calificación.
          [sql`${ratingAvg} desc nulls last`, sql`(${p.plan} = 'premium') desc`, sql`${jobsDone} desc`];

  return db
    .select({
      id: p.userId,
      name: u.name,
      tradeTitle: p.tradeTitle,
      categories: p.categories,
      zones: p.zones,
      referencePrice: p.referencePrice,
      priceUnit: p.priceUnit,
      availability: p.availability,
      plan: p.plan,
      avatarFileId: p.avatarFileId,
      yearsExperience: p.yearsExperience,
      verifiedAt: p.verifiedAt,
      rating: ratingAvg,
      reviewCount,
      jobsDone,
    })
    .from(p)
    .innerJoin(u, eq(u.id, p.userId))
    .where(and(...conds))
    .orderBy(...order)
    .limit(60);
}

export type ProfessionalCard = Awaited<ReturnType<typeof searchProfessionals>>[number];

export async function getPublicProfile(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await db
    .select({
      id: p.userId,
      name: u.name,
      tradeTitle: p.tradeTitle,
      categories: p.categories,
      zones: p.zones,
      bio: p.bio,
      yearsExperience: p.yearsExperience,
      referencePrice: p.referencePrice,
      priceUnit: p.priceUnit,
      availability: p.availability,
      plan: p.plan,
      avatarFileId: p.avatarFileId,
      verifiedAt: p.verifiedAt,
      verificationExpiresAt: p.verificationExpiresAt,
      hasLicense: sql<boolean>`${p.licenseNumber} is not null`,
      memberSince: u.createdAt,
      isDemo: u.isDemo,
      rating: ratingAvg,
      reviewCount,
      jobsDone,
    })
    .from(p)
    .innerJoin(u, eq(u.id, p.userId))
    .where(and(eq(p.userId, id), visibleProfessional()));
  if (!row) return null;

  const reviews = await db
    .select({
      id: schema.reviews.id,
      rating: schema.reviews.rating,
      comment: schema.reviews.comment,
      tags: schema.reviews.tags,
      createdAt: schema.reviews.createdAt,
      clientName: u.name,
      jobTitle: schema.serviceRequests.title,
      category: schema.serviceRequests.categorySlug,
      finishedAt: schema.jobs.finishedAt,
    })
    .from(schema.reviews)
    .innerJoin(u, eq(u.id, schema.reviews.clientId))
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.reviews.jobId))
    .innerJoin(schema.serviceRequests, eq(schema.serviceRequests.id, schema.jobs.requestId))
    .where(and(eq(schema.reviews.professionalId, id), eq(schema.reviews.moderationStatus, "publicada")))
    .orderBy(sql`${schema.reviews.createdAt} desc`)
    .limit(30);

  const recentJobs = await db
    .select({
      title: schema.serviceRequests.title,
      category: schema.serviceRequests.categorySlug,
      zone: schema.serviceRequests.zone,
      finishedAt: schema.jobs.finishedAt,
    })
    .from(schema.jobs)
    .innerJoin(schema.serviceRequests, eq(schema.serviceRequests.id, schema.jobs.requestId))
    .where(and(eq(schema.jobs.professionalId, id), sql`${schema.jobs.finishedAt} is not null`))
    .orderBy(sql`${schema.jobs.finishedAt} desc`)
    .limit(6);

  return { ...row, reviews, recentJobs };
}

export async function featuredReviews(limit = 3) {
  return db
    .select({
      id: schema.reviews.id,
      rating: schema.reviews.rating,
      comment: schema.reviews.comment,
      tags: schema.reviews.tags,
      clientName: u.name,
      proId: schema.reviews.professionalId,
      proName: sql<string>`(select name from users where id = ${schema.reviews.professionalId})`,
      category: schema.serviceRequests.categorySlug,
    })
    .from(schema.reviews)
    .innerJoin(u, eq(u.id, schema.reviews.clientId))
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.reviews.jobId))
    .innerJoin(schema.serviceRequests, eq(schema.serviceRequests.id, schema.jobs.requestId))
    .where(and(eq(schema.reviews.moderationStatus, "publicada"), sql`${schema.reviews.rating} = 5`, sql`length(${schema.reviews.comment}) > 70`))
    .orderBy(sql`${schema.reviews.createdAt} desc`)
    .limit(limit);
}

export async function categoryCounts() {
  const rows = await db
    .select({ slug: sql<string>`unnest(${p.categories})`, n: sql<number>`count(*)::int` })
    .from(p)
    .innerJoin(u, eq(u.id, p.userId))
    .where(visibleProfessional())
    .groupBy(sql`1`);
  return Object.fromEntries(rows.map((r) => [r.slug, r.n])) as Record<string, number>;
}
