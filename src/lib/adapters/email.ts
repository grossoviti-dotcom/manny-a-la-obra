import { db, schema } from "@/db";

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailProvider {
  send(msg: EmailMessage): Promise<void>;
}

/** Adaptador mock: escribe en consola y en la tabla email_log. Reemplazar por Resend/SES/etc. */
class ConsoleEmailProvider implements EmailProvider {
  async send(msg: EmailMessage) {
    console.info(`[email:mock] → ${msg.to} | ${msg.subject}\n${msg.body}`);
    await db.insert(schema.emailLog).values(msg);
  }
}

export const emailProvider: EmailProvider = new ConsoleEmailProvider();

export async function notify(to: string | null | undefined, subject: string, body: string) {
  if (!to) return;
  try {
    await emailProvider.send({ to, subject, body });
  } catch (e) {
    console.error("[email] no se pudo enviar", e);
  }
}
