import { z } from "zod";
import { CATEGORY_SLUGS, ZONES, REVIEW_TAGS } from "@/lib/constants";

const zone = z.enum(ZONES as unknown as [string, ...string[]], { error: "Elegí una zona." });

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre.").max(80),
  email: z.string().trim().toLowerCase().email("Ingresá un email válido.").max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+\-\s()]*$/, "Teléfono inválido.")
    .optional()
    .transform((v) => v || null),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(100),
  role: z.enum(["cliente", "profesional"]),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ingresá un email válido."),
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export const profileSchema = z.object({
  tradeTitle: z.string().trim().min(3, "Contanos tu oficio.").max(80),
  categories: z.array(z.enum(CATEGORY_SLUGS)).min(1, "Elegí al menos una categoría.").max(3, "Hasta 3 categorías."),
  bio: z.string().trim().min(30, "Escribí al menos 30 caracteres sobre tu experiencia.").max(1200),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  zones: z.array(zone).min(1, "Elegí al menos una zona.").max(12, "Hasta 12 zonas."),
  referencePrice: z.coerce.number().int().min(0).max(10_000_000).optional(),
  priceUnit: z.enum(["visita", "hora", "trabajo"]),
  availability: z.enum(["hoy", "esta_semana", "a_coordinar"]),
  licenseNumber: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => v || null),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+\-\s()]*$/, "Teléfono inválido.")
    .optional()
    .transform((v) => v || null),
});

export const requestSchema = z.object({
  categorySlug: z.enum(CATEGORY_SLUGS, { error: "Elegí un servicio." }),
  title: z.string().trim().min(5, "Poné un título corto (mín. 5 caracteres).").max(90),
  description: z.string().trim().min(20, "Describí el problema con al menos 20 caracteres.").max(2000),
  zone,
  urgency: z.enum(["baja", "media", "urgente"]),
  desiredDate: z
    .string()
    .optional()
    .transform((v) => v || null)
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Fecha inválida."),
  professionalIds: z.array(z.string().uuid()).min(1, "Elegí al menos un profesional.").max(5, "Podés pedir hasta 5 presupuestos."),
});

export const quoteSchema = z.object({
  price: z.coerce.number({ error: "Ingresá un precio." }).int().min(1, "Ingresá un precio.").max(100_000_000),
  durationText: z.string().trim().min(2, "Indicá el plazo estimado.").max(80),
  availableFrom: z
    .string()
    .optional()
    .transform((v) => v || null),
  message: z.string().trim().min(10, "Escribí un mensaje para el cliente (mín. 10 caracteres).").max(1500),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Elegí una calificación.").max(5),
  comment: z.string().trim().min(10, "Contá tu experiencia en al menos 10 caracteres.").max(1500),
  tags: z.array(z.enum(REVIEW_TAGS)).max(5).default([]),
});

export const claimSchema = z.object({
  reason: z.enum([
    "trabajo_mal_hecho",
    "incumplimiento_plazo",
    "precio_distinto",
    "no_se_presento",
    "danos",
    "trato_inadecuado",
    "otro",
  ]),
  description: z.string().trim().min(20, "Describí qué pasó en al menos 20 caracteres.").max(3000),
});

export const messageSchema = z.object({ body: z.string().trim().min(1, "Escribí un mensaje.").max(2000) });

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre.").max(80),
  email: z.string().trim().email("Ingresá un email válido.").max(120),
  topic: z.enum(["consulta", "profesional", "reclamo", "prensa", "otro"]),
  message: z.string().trim().min(10, "Escribí tu consulta (mín. 10 caracteres).").max(3000),
});
