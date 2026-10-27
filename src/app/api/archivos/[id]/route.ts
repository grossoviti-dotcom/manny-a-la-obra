import { getActor } from "@/lib/auth/session";
import { canAccessFile, readFile } from "@/lib/services/files";

/** Sirve archivos con control de acceso. Los documentos de verificación nunca son públicos. */
export async function GET(_req: Request, ctx: RouteContext<"/api/archivos/[id]">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("No encontrado", { status: 404 });
  const actor = await getActor();
  const { file, allowed } = await canAccessFile(actor, id);
  // 404 también cuando no hay permiso, para no revelar que el archivo existe.
  if (!file || !allowed) return new Response("No encontrado", { status: 404 });
  const full = await readFile(id);
  if (!full) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(full.data), {
    headers: {
      "Content-Type": full.mime,
      "Content-Length": String(full.size),
      "Cache-Control": full.kind === "avatar" ? "public, max-age=86400" : "private, no-store",
      "Content-Disposition": `inline; filename="archivo-${id.slice(0, 8)}"`,
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
