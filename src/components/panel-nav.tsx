import Link from "next/link";

export function PanelNav({ items, title, user }: { items: [string, string][]; title: string; user: string }) {
  return (
    <div className="border-b border-border bg-paper-2">
      <div className="container-page py-6">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-orange-deep">{title}</p>
        <p className="font-display text-2xl font-bold uppercase">Hola, {user.split(" ")[0]}</p>
        <nav aria-label="Panel" className="-mx-1 mt-4 flex gap-1 overflow-x-auto pb-1">
          {items.map(([href, label]) => (
            <Link key={href} href={href} className="shrink-0 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold hover:border-ink">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
