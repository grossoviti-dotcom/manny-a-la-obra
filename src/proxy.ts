import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";

export const ANON_COOKIE = "manny_anon";
const PROTECTED: Record<string, string[]> = {
  "/cliente": ["cliente"],
  "/profesional": ["profesional"],
  "/admin": ["admin"],
  "/pedidos": ["cliente", "profesional", "admin"],
  "/reclamos": ["cliente", "profesional", "admin"],
};

/** Chequeo optimista de sesión y cookie anónima para la analítica de embudo. La autorización real ocurre en el servidor. */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const prefix = Object.keys(PROTECTED).find((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (prefix) {
    const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      const url = new URL("/ingresar", request.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
  }
  const res = NextResponse.next();
  if (!request.cookies.get(ANON_COOKIE)) {
    res.cookies.set(ANON_COOKIE, crypto.randomUUID(), { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 180, path: "/" });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|robots.txt|sitemap.xml|api/archivos).*)"],
};
