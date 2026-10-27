import Link from "next/link";
import { Logo } from "./logo";
import { SITE } from "@/lib/constants";

const COLS = [
  { title: "Plataforma", links: [["/buscar", "Buscar profesional"], ["/como-funciona", "Cómo funciona"], ["/seguridad", "Seguridad y verificación"], ["/garantia", "Garantía y respaldo"]] },
  { title: "Profesionales", links: [["/para-profesionales", "Sumate como profesional"], ["/registrarse?rol=profesional", "Crear cuenta profesional"], ["/ingresar", "Ingresar"]] },
  { title: "Manny a la Obra", links: [["/sobre-nosotros", "Sobre nosotros"], ["/ayuda", "Ayuda y preguntas frecuentes"], ["/ayuda#contacto", "Contacto"]] },
  { title: "Legales", links: [["/legal/terminos", "Términos y condiciones"], ["/legal/privacidad", "Política de privacidad"], ["/legal/resenas", "Política de reseñas"], ["/legal/reclamos", "Reclamos y garantía"]] },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-ink text-paper">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-xs text-sm text-muted-light">{SITE.descriptor}</p>
          <p className="mt-4 font-display text-lg font-semibold uppercase text-orange">{SITE.slogan}</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-light">{c.title}</h2>
            <ul className="space-y-2 text-sm">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-orange hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-card-dark">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted-light sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Manny a la Obra · Rosario, Santa Fe, Argentina</p>
          <p>Proyecto de la Licenciatura en Gestión de Negocios Digitales · UCA Rosario</p>
        </div>
      </div>
    </footer>
  );
}
