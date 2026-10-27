"use server";

import { db, schema } from "@/db";
import { contactSchema } from "@/lib/validation";
import { toActionError, type ActionState } from "@/lib/errors";
import { notify } from "@/lib/adapters/email";
import { SITE } from "@/lib/constants";

export async function contactAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    if (form.get("website")) return { ok: true, message: "¡Gracias! Te respondemos a la brevedad." }; // honeypot
    const data = contactSchema.parse(Object.fromEntries(form));
    await db.insert(schema.contactMessages).values(data);
    await notify(SITE.email, `Contacto (${data.topic}) de ${data.name}`, `${data.email}\n\n${data.message}`);
    return { ok: true, message: "¡Gracias! Recibimos tu mensaje y te respondemos dentro de las 48 h hábiles." };
  } catch (e) {
    return toActionError(e);
  }
}
