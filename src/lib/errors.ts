/** Error de dominio con un mensaje apto para mostrar al usuario. */
export class DomainError extends Error {
  constructor(
    message: string,
    public code: "forbidden" | "not_found" | "invalid" | "conflict" = "invalid",
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export type Actor = { id: string; role: "cliente" | "profesional" | "admin" };

export function assertRole(actor: Actor | null | undefined, ...roles: Actor["role"][]): asserts actor is Actor {
  if (!actor) throw new DomainError("Tenés que ingresar para continuar.", "forbidden");
  if (!roles.includes(actor.role)) throw new DomainError("No tenés permiso para hacer esto.", "forbidden");
}

export type ActionState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> };

export function toActionError(e: unknown): ActionState {
  if (e instanceof DomainError) return { error: e.message };
  if (e && typeof e === "object" && "issues" in e) {
    const issues = (e as { issues: { path: PropertyKey[]; message: string }[] }).issues;
    const fieldErrors: Record<string, string> = {};
    for (const i of issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
    return { error: "Revisá los datos marcados.", fieldErrors };
  }
  console.error(e);
  return { error: "Ocurrió un error inesperado. Probá de nuevo en unos minutos." };
}
