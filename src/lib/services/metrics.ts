import { sql } from "drizzle-orm";
import { db } from "@/db";
import { assertRole, type Actor } from "@/lib/errors";

async function one<T>(query: ReturnType<typeof sql>): Promise<T> {
  const res = await db.execute(query);
  return res.rows[0] as T;
}

const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);

/** Indicadores del MVP (sección 8). Ver src/lib/analytics.ts para los eventos. */
export async function getMetrics(actor: Actor) {
  assertRole(actor, "admin");

  const users = await one<{ total: number; clientes: number; profesionales: number; demo: number }>(sql`
    select count(*)::int total,
      count(*) filter (where role = 'cliente')::int clientes,
      count(*) filter (where role = 'profesional')::int profesionales,
      count(*) filter (where is_demo)::int demo
    from users`);

  const pros = await one<{ started: number; submitted: number; verified: number; expiring: number }>(sql`
    select count(*)::int started,
      count(*) filter (where verification_status in ('en_revision','verificado','rechazado'))::int submitted,
      count(*) filter (where verification_status = 'verificado' and verification_expires_at > now())::int verified,
      count(*) filter (where verification_status = 'verificado' and verification_expires_at between now() and now() + interval '30 days')::int expiring
    from professional_profiles`);

  const funnel = await one<{ searches: number; searchers: number; searchersWithRequest: number; requests: number; hired: number }>(sql`
    select
      (select count(*)::int from analytics_events where name = 'search_performed') searches,
      (select count(distinct coalesce(anon_id, user_id::text))::int from analytics_events where name = 'search_performed') searchers,
      (select count(distinct coalesce(s.anon_id, s.user_id::text))::int from analytics_events s
         where s.name = 'search_performed' and exists (
           select 1 from analytics_events q where q.name = 'quote_request_created'
             and (q.anon_id = s.anon_id or q.user_id = s.user_id)
             and q.created_at >= s.created_at)) "searchersWithRequest",
      (select count(*)::int from service_requests) requests,
      (select count(*)::int from jobs) hired`);

  const rating = await one<{ avg: number | null; n: number; flagged: number }>(sql`
    select round(avg(rating) filter (where moderation_status = 'publicada')::numeric, 2)::float avg,
      count(*) filter (where moderation_status = 'publicada')::int n,
      count(*) filter (where moderation_status = 'en_revision' or flag_reason is not null)::int flagged
    from reviews`);

  const time = await one<{ hoursToHire: number | null }>(sql`
    select round(avg(extract(epoch from (j.hired_at - r.created_at)) / 3600)::numeric, 1)::float "hoursToHire"
    from jobs j join service_requests r on r.id = j.request_id`);

  const claims = await one<{ open: number; total: number; avgResolutionHours: number | null }>(sql`
    select count(*) filter (where status in ('abierto','en_mediacion'))::int open,
      count(*)::int total,
      round(avg(extract(epoch from (resolved_at - created_at)) / 3600) filter (where resolved_at is not null)::numeric, 1)::float "avgResolutionHours"
    from claims`);

  const jobs = await one<{ hired: number; finished: number }>(sql`
    select count(*)::int hired, count(*) filter (where finished_at is not null)::int finished from jobs`);

  const queues = await one<{ verifications: number; reviews: number; claims: number }>(sql`
    select (select count(*)::int from professional_profiles where verification_status = 'en_revision') verifications,
      (select count(*)::int from reviews where moderation_status = 'en_revision') reviews,
      (select count(*)::int from claims where status in ('abierto','en_mediacion')) claims`);

  return {
    users,
    pros,
    funnel,
    rating,
    time,
    claims,
    jobs,
    queues,
    goals: {
      verificationRate: { value: pct(pros.verified, pros.started), target: 60 },
      searchToRequest: { value: pct(funnel.searchersWithRequest, funnel.searchers), target: 30 },
      requestToHire: { value: pct(funnel.hired, funnel.requests), target: 20 },
      avgRating: { value: rating.avg, target: 4.5 },
    },
    inPlatformRate: pct(jobs.finished, jobs.hired),
  };
}

export async function listUsers(actor: Actor) {
  assertRole(actor, "admin");
  const res = await db.execute(sql`
    select u.id, u.name, u.email, u.role, u.is_demo "isDemo", u.suspended, u.created_at "createdAt",
      p.verification_status "verificationStatus", p.plan, p.trade_title "tradeTitle"
    from users u left join professional_profiles p on p.user_id = u.id
    order by u.role, u.created_at desc`);
  return res.rows as {
    id: string;
    name: string;
    email: string;
    role: string;
    isDemo: boolean;
    suspended: boolean;
    createdAt: string;
    verificationStatus: string | null;
    plan: string | null;
    tradeTitle: string | null;
  }[];
}

export async function recentEmails(actor: Actor) {
  assertRole(actor, "admin");
  const res = await db.execute(sql`select "to", subject, created_at "createdAt" from email_log order by created_at desc limit 15`);
  return res.rows as { to: string; subject: string; createdAt: string }[];
}
