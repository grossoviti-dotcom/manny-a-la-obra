import { CATEGORIES, ZONES } from "@/lib/constants";
import { IconSearch } from "./icons";
import { btn, cx } from "./ui";

export function SearchBar({ categoria, zona, dark, stacked }: { categoria?: string; zona?: string; dark?: boolean; stacked?: boolean }) {
  return (
    <form action="/buscar" method="get" role="search" aria-label="Buscar profesionales" className={cx("grid gap-3 rounded-[20px] p-3", !stacked && "sm:grid-cols-[1fr_1fr_auto]", dark ? "bg-paper" : "bg-white ring-1 ring-border")}>
      <div>
        <label htmlFor="sb-categoria" className="mb-1 block px-1 text-xs font-bold uppercase tracking-wider text-muted">
          ¿Qué necesitás?
        </label>
        <select id="sb-categoria" name="categoria" defaultValue={categoria ?? ""} className="input !border-border">
          <option value="">Todos los servicios</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="sb-zona" className="mb-1 block px-1 text-xs font-bold uppercase tracking-wider text-muted">
          ¿Dónde? (barrio o localidad)
        </label>
        <select id="sb-zona" name="zona" defaultValue={zona ?? ""} className="input !border-border">
          <option value="">Rosario y alrededores</option>
          {ZONES.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className={cx(btn.primary, "self-end", !stacked && "sm:min-h-[50px]")}>
        <IconSearch size={18} />
        Buscar profesional
      </button>
    </form>
  );
}
