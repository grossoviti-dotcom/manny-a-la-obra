"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, homeForRole } from "@/lib/auth/session";
import { authenticate, registerUser } from "@/lib/services/users";
import { toActionError, type ActionState } from "@/lib/errors";

const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : null;
};

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  let dest: string;
  try {
    const user = await authenticate({ email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") });
    await createSession(user);
    dest = safeNext(form.get("next")) ?? homeForRole(user.role);
  } catch (e) {
    return toActionError(e);
  }
  redirect(dest);
}

export async function registerAction(_: ActionState, form: FormData): Promise<ActionState> {
  let dest: string;
  try {
    if (form.get("terms") !== "on") return { error: "Tenés que aceptar los términos y la política de privacidad.", fieldErrors: { terms: "Requerido." } };
    const user = await registerUser({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      password: String(form.get("password") ?? ""),
      role: form.get("role") === "profesional" ? "profesional" : "cliente",
    });
    await createSession(user);
    dest = user.role === "profesional" ? "/profesional/perfil?bienvenida=1" : safeNext(form.get("next")) ?? "/cliente";
  } catch (e) {
    return toActionError(e);
  }
  redirect(dest);
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
