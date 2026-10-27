import { requireUser } from "@/lib/auth/session";
import { PanelNav } from "@/components/panel-nav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser("admin", "/admin");
  return (
    <>
      <PanelNav
        title="Operación · Manny a la Obra"
        user={user.name}
        items={[
          ["/admin", "Métricas"],
          ["/admin/verificaciones", "Verificaciones"],
          ["/admin/reclamos", "Reclamos"],
          ["/admin/resenas", "Moderación de reseñas"],
          ["/admin/usuarios", "Usuarios"],
        ]}
      />
      <div className="container-page py-8">{children}</div>
    </>
  );
}
