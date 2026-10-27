import Link from "next/link";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2" aria-label="Manny a la Obra, ir al inicio">
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-orange font-display text-xl font-bold text-ink" aria-hidden>
        M
      </span>
      <span className={`font-display text-xl font-bold uppercase leading-none ${dark ? "text-paper" : "text-ink"}`}>
        Manny <span className="text-orange">a la obra</span>
      </span>
    </Link>
  );
}
