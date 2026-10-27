/**
 * Interfaz para un proveedor externo de verificación de identidad (p. ej. RENAPER vía
 * un integrador, Veriff, Onfido). En el MVP la decisión la toma un admin a mano; el
 * adaptador mock sólo registra una referencia y devuelve "revisión manual".
 */
export interface IdentityCheckInput {
  professionalId: string;
  fullName: string;
  documentFileIds: string[];
}

export interface IdentityCheckResult {
  reference: string;
  outcome: "aprobado" | "rechazado" | "revision_manual";
  detail?: string;
}

export interface IdentityVerificationProvider {
  readonly name: string;
  submit(input: IdentityCheckInput): Promise<IdentityCheckResult>;
}

class MockIdentityProvider implements IdentityVerificationProvider {
  readonly name = "mock";
  async submit(input: IdentityCheckInput): Promise<IdentityCheckResult> {
    return {
      reference: `mock-${input.professionalId.slice(0, 8)}-${Date.now()}`,
      outcome: "revision_manual",
      detail: "Proveedor simulado: requiere revisión manual del equipo.",
    };
  }
}

export const identityProvider: IdentityVerificationProvider = new MockIdentityProvider();
