"use client";

import { btn } from "@/components/ui";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-3xl font-bold uppercase">Algo salió mal</h1>
      <p className="mt-2 text-muted">Tuvimos un problema al cargar esta página. Probá de nuevo en unos segundos.</p>
      <button onClick={reset} className={`${btn.primary} mt-6`}>Reintentar</button>
    </div>
  );
}
