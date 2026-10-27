import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { searchProfessionals } from "@/lib/services/search";
import { EmptyState, PageHeader } from "@/components/ui";
import { RequestForm } from "./request-form";

export const metadata: Metadata = { title: "Pedir presupuesto", robots: { index: false } };

export default async function RequestPage(props: PageProps<"/pedir-presupuesto">) {
  const sp = await props.searchParams;
  const pro = ([] as string[]).concat(sp.pro ?? []).filter((x) => /^[0-9a-f-]{36}$/i.test(x));
  const next = `/pedir-presupuesto${pro.length ? `?${pro.map((p) => `pro=${p}`).join("&")}` : ""}`;
  const user = await requireUser(undefined, next);
  if (user.role !== "cliente") {
    return (
      <div className="container-page py-12">
        <EmptyState title="Esta función es para clientes">Ingresaste con una cuenta de {user.role}. Para pedir presupuestos, usá una cuenta de cliente.</EmptyState>
      </div>
    );
  }
  const all = await searchProfessionals({});
  const first = all.find((p) => pro.includes(p.id));
  return (
    <div className="container-page py-10">
      <PageHeader eyebrow="Pedir presupuesto" title="Un pedido, varios presupuestos">
        Describí el trabajo una vez y elegí a quiénes enviárselo. Vas a poder comparar las respuestas lado a lado.
      </PageHeader>
      <RequestForm pros={all} preselected={first ? [first.id] : []} defaultCategory={first?.categories[0]} />
    </div>
  );
}
