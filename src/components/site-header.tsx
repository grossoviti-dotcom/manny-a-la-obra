import Link from "next/link";
import { getCurrentUser, homeForRole } from "@/lib/auth/session";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "./logo";
import { IconMenu } from "./icons";
import { btn, cx } from "./ui";

const NAV = [
  { href: "/buscar", label: "Buscar profesional" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/garantia", label: "Respaldo" },
  { href: "/para-profesionales", label: "Para profesionales" },
  { href: "/ayuda", label: "Ayuda" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const panel = user ? homeForRole(user.role) : null;

  const account = user ? (
    <>
      <Link href={panel!} className={cx(btn.dark, btn.sm)}>
        Mi panel
      </Link>
      <form action={logoutAction}>
        <button className={cx(btn.ghost, btn.sm)}>Salir</button>
      </form>
    </>
  ) : (
    <>
      <Link href="/ingresar" className={cx(btn.ghost, btn.sm)}>
        Ingresar
      </Link>
      <Link href="/registrarse" className={cx(btn.primary, btn.sm)}>
        Crear cuenta
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Principal" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-paper-2">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-2 xl:flex">{account}</div>

        <details className="group relative xl:hidden">
          <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full hover:bg-paper-2 [&::-webkit-details-marker]:hidden">
            <IconMenu />
            <span className="sr-only">Abrir menú</span>
          </summary>
          <div className="absolute right-0 top-12 w-72 rounded-2xl border border-border bg-paper p-3 shadow-xl">
            <nav aria-label="Menú móvil">
              <ul className="flex flex-col">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="block rounded-xl px-3 py-3 font-semibold hover:bg-paper-2">
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-2 flex flex-wrap gap-2 border-t border-border pt-3">{account}</div>
          </div>
        </details>
      </div>
    </header>
  );
}
