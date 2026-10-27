import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="font-display text-7xl font-bold text-orange">404</p>
      <h1 className="mt-2 text-3xl font-bold uppercase">No encontramos esta página</h1>
      <p className="mt-2 text-muted">Puede que el enlace esté mal o que el perfil ya no esté disponible.</p>
      <div className="mt-6 flex justify-center gap-3">
        <ButtonLink href="/">Ir al inicio</ButtonLink>
        <ButtonLink href="/buscar" variant="secondary">Buscar profesional</ButtonLink>
      </div>
    </div>
  );
}
