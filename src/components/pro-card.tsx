import Link from "next/link";
import type { ProfessionalCard } from "@/lib/services/search";
import { AVAILABILITY_LABEL, categoryName } from "@/lib/constants";
import { Avatar, ButtonLink, Chip, PRICE_UNIT, Stars, VerifiedBadge, money } from "./ui";
import { IconClock, IconMapPin } from "./icons";

export function ProCard({ pro, zona }: { pro: ProfessionalCard; zona?: string }) {
  const zones = zona && pro.zones.includes(zona) ? [zona, ...pro.zones.filter((z) => z !== zona)] : pro.zones;
  return (
    <article className="card flex flex-col gap-4 p-5 sm:flex-row" aria-labelledby={`pro-${pro.id}`}>
      <Avatar name={pro.name} fileId={pro.avatarFileId} size={72} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={`pro-${pro.id}`} className="text-xl font-semibold uppercase">
            <Link href={`/profesionales/${pro.id}`} className="hover:underline">
              {pro.name}
            </Link>
          </h2>
          <VerifiedBadge compact />
          {pro.plan === "premium" && <Chip className="!border-orange !bg-orange/10 !py-0.5 text-xs">Destacado</Chip>}
        </div>
        <p className="mt-0.5 font-medium text-muted">{pro.tradeTitle}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Stars value={pro.rating} />
            <strong>{pro.rating ? pro.rating.toLocaleString("es-AR") : "Nuevo"}</strong>
            <span className="text-muted">({pro.reviewCount} reseñas)</span>
          </span>
          <span>
            <strong>{pro.jobsDone}</strong> <span className="text-muted">trabajos en la plataforma</span>
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1">
            <IconMapPin size={16} /> {zones.slice(0, 3).join(", ")}
            {zones.length > 3 && ` +${zones.length - 3}`}
          </span>
          <span className="inline-flex items-center gap-1">
            <IconClock size={16} /> {AVAILABILITY_LABEL[pro.availability]}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pro.categories.map((c) => (
            <Chip key={c}>{categoryName(c)}</Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-row items-end justify-between gap-3 border-t border-border pt-4 sm:w-48 sm:flex-col sm:items-stretch sm:justify-start sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Precio de referencia</p>
          <p className="font-display text-2xl font-bold">
            <span className="text-sm font-normal text-muted">desde </span>
            {money(pro.referencePrice)}
          </p>
          <p className="text-xs text-muted">{PRICE_UNIT[pro.priceUnit]}</p>
        </div>
        <div className="flex flex-col gap-2">
          <ButtonLink href={`/pedir-presupuesto?pro=${pro.id}`} className="!px-4">
            Pedir presupuesto
          </ButtonLink>
          <Link href={`/profesionales/${pro.id}`} className="text-center text-sm font-semibold underline underline-offset-4">
            Ver perfil
          </Link>
        </div>
      </div>
    </article>
  );
}
