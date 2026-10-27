import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { FILE_LIMITS } from "@/lib/constants";
import { DomainError, type Actor } from "@/lib/errors";

type Kind = "verificacion" | "pedido" | "reclamo" | "avatar";

function sniffMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}

/** Valida tamaño y tipo real (por firma, no por extensión) y guarda el archivo. */
export async function saveUpload(ownerId: string, kind: Kind, file: File) {
  if (!file || file.size === 0) throw new DomainError("El archivo está vacío.");
  if (file.size > FILE_LIMITS.maxBytes) throw new DomainError("Cada archivo puede pesar hasta 5 MB.");
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniffMime(buf);
  const allowed = kind === "verificacion" ? FILE_LIMITS.docMimes : FILE_LIMITS.imageMimes;
  if (!mime || !allowed.includes(mime)) {
    throw new DomainError(
      kind === "verificacion" ? "Formato no admitido. Usá JPG, PNG, WEBP o PDF." : "Formato no admitido. Usá JPG, PNG o WEBP.",
    );
  }
  const [row] = await db
    .insert(schema.files)
    .values({ ownerId, kind, mime, size: buf.length, data: buf, originalName: file.name?.slice(0, 120) || null })
    .returning({ id: schema.files.id });
  return row.id;
}

export async function saveUploads(ownerId: string, kind: Kind, files: File[]) {
  const real = files.filter((f) => f && f.size > 0);
  if (real.length > FILE_LIMITS.maxPhotos) throw new DomainError(`Podés subir hasta ${FILE_LIMITS.maxPhotos} fotos.`);
  const ids: string[] = [];
  for (const f of real) ids.push(await saveUpload(ownerId, kind, f));
  return ids;
}

/**
 * Política de acceso a archivos:
 * - verificación: sólo el propio profesional y admins (nunca público).
 * - fotos de pedido: el cliente, los profesionales invitados al pedido y admins.
 * - fotos de reclamo: el cliente, el profesional del trabajo y admins.
 * - avatar: público.
 */
export async function canAccessFile(actor: Actor | null, fileId: string) {
  const [file] = await db
    .select({ id: schema.files.id, ownerId: schema.files.ownerId, kind: schema.files.kind })
    .from(schema.files)
    .where(eq(schema.files.id, fileId))
    .limit(1);
  if (!file) return { file: null, allowed: false };
  if (file.kind === "avatar") return { file, allowed: true };
  if (!actor) return { file, allowed: false };
  if (actor.role === "admin" || actor.id === file.ownerId) return { file, allowed: true };
  if (file.kind === "verificacion") return { file, allowed: false };

  if (file.kind === "pedido" && actor.role === "profesional") {
    const rows = await db
      .select({ id: schema.quotes.id })
      .from(schema.quotes)
      .innerJoin(schema.serviceRequests, eq(schema.serviceRequests.id, schema.quotes.requestId))
      .where(and(eq(schema.quotes.professionalId, actor.id), sql`${fileId}::uuid = any(${schema.serviceRequests.photoIds})`))
      .limit(1);
    return { file, allowed: rows.length > 0 };
  }
  if (file.kind === "reclamo" && actor.role === "profesional") {
    const rows = await db
      .select({ id: schema.claims.id })
      .from(schema.claims)
      .where(and(eq(schema.claims.professionalId, actor.id), sql`${fileId}::uuid = any(${schema.claims.photoIds})`))
      .limit(1);
    return { file, allowed: rows.length > 0 };
  }
  return { file, allowed: false };
}

export async function readFile(fileId: string) {
  const [f] = await db.select().from(schema.files).where(eq(schema.files.id, fileId)).limit(1);
  return f ?? null;
}
