import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { IconShieldCheck, IconStar } from "./icons";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
export { cx };

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-11 px-5 py-2.5 text-[0.95rem] text-center";
export const btn = {
  primary: cx(btnBase, "bg-orange text-ink hover:bg-[#d4561a]"),
  secondary: cx(btnBase, "border-2 border-ink text-ink hover:bg-ink hover:text-paper"),
  dark: cx(btnBase, "bg-ink text-paper hover:bg-card-dark"),
  ghost: cx(btnBase, "text-ink hover:bg-paper-2"),
  onDark: cx(btnBase, "border-2 border-paper text-paper hover:bg-paper hover:text-ink"),
  danger: cx(btnBase, "border-2 border-danger text-danger hover:bg-danger hover:text-white"),
  sm: "!min-h-9 !px-4 !py-1.5 !text-sm",
};

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof btn }) {
  return <Link {...props} className={cx(btn[variant], className)} />;
}

export function VerifiedBadge({ date, compact }: { date?: Date | string | null; compact?: boolean }) {
  const d = date ? new Date(date) : null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-sm font-semibold text-success ring-1 ring-success/30">
      <IconShieldCheck size={16} />
      Verificado
      {d && !compact && (
        <span className="font-normal text-success/90">
          · {d.toLocaleDateString("es-AR", { month: "short", year: "numeric" })}
        </span>
      )}
    </span>
  );
}

export function Stars({ value, size = 16, label = true }: { value: number | null; size?: number; label?: boolean }) {
  const v = value ?? 0;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex text-orange" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <IconStar key={i} size={size} filled={v >= i - 0.25} className={v >= i - 0.25 ? "" : "text-border"} />
        ))}
      </span>
      {label && <span className="sr-only">{value ? `${value.toLocaleString("es-AR")} de 5 estrellas` : "Sin calificaciones"}</span>}
    </span>
  );
}

export function Chip({ children, active, className }: { children: ReactNode; active?: boolean; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium",
        active ? "border-ink bg-ink text-paper" : "border-border bg-paper-2 text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, string> = {
  solicitado: "bg-paper-2 text-ink ring-border",
  solicitada: "bg-paper-2 text-ink ring-border",
  presupuestado: "bg-orange/15 text-orange-deep ring-orange/40",
  enviada: "bg-orange/15 text-orange-deep ring-orange/40",
  contratado: "bg-ink text-paper ring-ink",
  aceptada: "bg-ink text-paper ring-ink",
  en_curso: "bg-[#e4ecf5] text-[#1d4a7a] ring-[#9db6d3]",
  finalizado: "bg-success/10 text-success ring-success/40",
  calificado: "bg-success text-white ring-success",
  en_reclamo: "bg-danger/10 text-danger ring-danger/40",
  cancelado: "bg-paper-2 text-muted ring-border",
  rechazada: "bg-paper-2 text-muted ring-border",
  descartada: "bg-paper-2 text-muted ring-border",
  pendiente: "bg-paper-2 text-ink ring-border",
  en_revision: "bg-orange/15 text-orange-deep ring-orange/40",
  verificado: "bg-success/10 text-success ring-success/40",
  rechazado: "bg-danger/10 text-danger ring-danger/40",
  abierto: "bg-danger/10 text-danger ring-danger/40",
  en_mediacion: "bg-orange/15 text-orange-deep ring-orange/40",
  resuelto: "bg-success/10 text-success ring-success/40",
  cerrado: "bg-paper-2 text-muted ring-border",
  publicada: "bg-success/10 text-success ring-success/40",
  oculta: "bg-paper-2 text-muted ring-border",
};

/** Estado con texto siempre visible (nunca sólo color). */
export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1",
        STATUS_TONE[status] ?? "bg-paper-2 text-ink ring-border",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

const AVATAR_TONES = ["#E8641C", "#2F7D6B", "#1C1F24", "#8A5A3B", "#3E5C76", "#6B4E71"];
export function Avatar({ name, fileId, size = 56 }: { name: string; fileId?: string | null; size?: number }) {
  if (fileId) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/archivos/${fileId}`} alt={`Foto de ${name}`} width={size} height={size} className="rounded-2xl object-cover" style={{ width: size, height: size }} />;
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const tone = AVATAR_TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  const light = tone === "#E8641C";
  return (
    <span
      role="img"
      aria-label={`Foto de perfil de ${name}`}
      className="inline-flex shrink-0 items-center justify-center rounded-2xl font-display font-semibold"
      style={{ width: size, height: size, background: tone, color: light ? "#1C1F24" : "#F7F4EE", fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8">
      {eyebrow && <p className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-orange-deep">{eyebrow}</p>}
      <h1 className="text-3xl font-bold uppercase leading-tight sm:text-4xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-lg text-muted">{children}</div>}
    </header>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card-alt p-8 text-center">
      <p className="font-display text-xl font-semibold uppercase">{title}</p>
      {children && <div className="mt-2 text-muted">{children}</div>}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success" | "warn"; children: ReactNode }) {
  const tones = {
    info: "bg-paper-2 border-border",
    error: "bg-danger/5 border-danger/40 text-danger",
    success: "bg-success/10 border-success/40 text-success",
    warn: "bg-orange/10 border-orange/50 text-ink",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("rounded-xl border px-4 py-3 text-sm", tones[tone])}>
      {children}
    </div>
  );
}

export const money = (n: number | null | undefined) =>
  n == null ? "A consultar" : n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export const fmtDate = (d: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
  d ? new Date(d).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", ...opts }) : "—";

export const fmtDateTime = (d: Date | string) =>
  new Date(d).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const PRICE_UNIT = { visita: "la visita", hora: "la hora", trabajo: "por trabajo" } as Record<string, string>;
