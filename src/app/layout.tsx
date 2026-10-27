import type { Metadata, Viewport } from "next";
import { Oswald, Public_Sans } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE } from "@/lib/constants";
import "./globals.css";

const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["600", "700"], display: "swap" });
const publicSans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${SITE.name} · ${SITE.slogan}`, template: `%s · ${SITE.name}` },
  description: `${SITE.descriptor} Profesionales verificados en Rosario: electricistas, plomeros, gasistas, técnicos y más.`,
  applicationName: SITE.name,
  openGraph: { type: "website", locale: "es_AR", siteName: SITE.name, title: `${SITE.name} · ${SITE.slogan}`, description: SITE.descriptor },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#1C1F24", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${oswald.variable} ${publicSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a href="#contenido" className="sr-only z-50 rounded bg-ink px-4 py-2 text-paper focus:not-sr-only focus:absolute focus:left-3 focus:top-3">
          Saltar al contenido
        </a>
        <div className="bg-ink px-4 py-1.5 text-center text-xs text-muted-light">
          Versión de demostración (MVP): los profesionales, reseñas y pedidos que ves son ficticios.
        </div>
        <SiteHeader />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
