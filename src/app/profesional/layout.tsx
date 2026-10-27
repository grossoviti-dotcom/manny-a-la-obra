import { requireUser } from "@/lib/auth/session";
import { PanelNav } from "@/components/panel-nav";

export default async function ProLayout({ children }: LayoutProps<"/profesional">) {
  const user = await requireUser("profesional", "/profesional");
  return (
    <>
      <PanelNav
        title="Panel profesional"
        user={user.name}
        items={[
          ["/profesional", "Resumen y pedidos"],
          ["/profesional/perfil", "Mi perfil"],
          ["/profesional/verificacion", "Verificación"],
          ["/profesional#resenas", "Reseñas"],
          ["/profesional#plan", "Mi plan"],
        ]}
      />
      <div className="container-page py-8">{children}</div>
    </>
  );
}
