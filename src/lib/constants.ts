export const SITE = {
  name: "Manny a la Obra",
  slogan: "Encontrá. Compará. Confiá.",
  descriptor: "Una nueva forma de contratar servicios con seguridad y transparencia.",
  value: "Servicios de calidad, con confianza.",
  email: "hola@mannyalaobra.com.ar",
  city: "Rosario",
};

export const CATEGORIES = [
  { slug: "electricidad", name: "Electricidad", description: "Instalaciones, tableros, cortes y arreglos eléctricos.", secondary: false },
  { slug: "plomeria", name: "Plomería", description: "Pérdidas, destapaciones, termotanques y griferías.", secondary: false },
  { slug: "gas", name: "Gas", description: "Gasistas matriculados: instalaciones, pérdidas y artefactos.", secondary: false },
  { slug: "electrodomesticos", name: "Técnicos de electrodomésticos", description: "Heladeras, lavarropas, aires acondicionados y más.", secondary: false },
  { slug: "reparaciones-hogar", name: "Reparaciones del hogar", description: "Albañilería, pintura, carpintería y arreglos generales.", secondary: false },
  { slug: "tecnologia", name: "Servicios de tecnología", description: "PC, redes wifi, cámaras y configuración de equipos.", secondary: false },
  { slug: "mecanica", name: "Mecánica", description: "Mecánica liviana y diagnóstico a domicilio.", secondary: true },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];
export const categoryName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;

// Matrícula obligatoria para estos oficios.
export const LICENSED_CATEGORIES: string[] = ["gas", "electricidad"];

export const ZONES = [
  "Centro",
  "Pichincha",
  "Echesortu",
  "Abasto",
  "Lourdes",
  "República de la Sexta",
  "Barrio Martin",
  "Parque España",
  "Puerto Norte",
  "Alberdi",
  "Arroyito",
  "La Florida",
  "Fisherton",
  "Belgrano",
  "Refinería",
  "Bella Vista",
  "Echesortu Norte",
  "Saladillo",
  "Tablada",
  "Las Delicias",
  "Barrio Inglés",
  "Luis Agote",
  "Azcuénaga",
  "Ludueña",
  "Empalme Graneros",
  "Funes",
  "Roldán",
  "Granadero Baigorria",
  "Villa Gobernador Gálvez",
  "Pérez",
  "Capitán Bermúdez",
] as const;

export const REVIEW_TAGS = [
  "Puntualidad",
  "Prolijidad",
  "Precio justo",
  "Buena comunicación",
  "Resolvió rápido",
  "Confiable",
  "Explicó todo",
] as const;

export const URGENCY_LABEL = { baja: "Sin apuro", media: "Esta semana", urgente: "Urgente (24–48 h)" } as const;
export const AVAILABILITY_LABEL = { hoy: "Disponible hoy", esta_semana: "Disponible esta semana", a_coordinar: "A coordinar" } as const;

export const VERIFICATION_LABEL = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  verificado: "Verificado",
  rechazado: "Rechazado",
} as const;

export const DOC_TYPE_LABEL = {
  dni_frente: "DNI (frente)",
  dni_dorso: "DNI (dorso)",
  selfie: "Selfie sosteniendo el DNI",
  matricula: "Matrícula profesional",
} as const;

export const CLAIM_REASON_LABEL = {
  trabajo_mal_hecho: "El trabajo quedó mal hecho",
  incumplimiento_plazo: "No cumplió el plazo",
  precio_distinto: "Cobró distinto a lo presupuestado",
  no_se_presento: "No se presentó",
  danos: "Hubo daños en mi casa",
  trato_inadecuado: "Trato inadecuado",
  otro: "Otro motivo",
} as const;

export const CLAIM_STATUS_LABEL = {
  abierto: "Abierto",
  en_mediacion: "En mediación",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
} as const;

export const JOB_STATUS_LABEL = {
  solicitado: "Solicitado",
  presupuestado: "Presupuestado",
  contratado: "Contratado",
  en_curso: "En curso",
  finalizado: "Finalizado",
  calificado: "Calificado",
  en_reclamo: "En reclamo",
  cancelado: "Cancelado",
} as const;
export type FlowStatus = keyof typeof JOB_STATUS_LABEL;

export const QUOTE_STATUS_LABEL = {
  solicitada: "Esperando presupuesto",
  enviada: "Presupuesto enviado",
  aceptada: "Contratado",
  rechazada: "No disponible",
  descartada: "No elegido",
} as const;

export const PLANS = {
  gratis: { name: "Gratis", price: "USD 0", detail: "Sin costo fijo. Comisión del 15% sólo sobre los trabajos que concretás en la plataforma." },
  premium: { name: "Premium", price: "USD 9/mes", detail: "Mayor visibilidad en las búsquedas, insignia Destacado y estadísticas de tu perfil." },
} as const;

export const FILE_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  maxPhotos: 4,
  imageMimes: ["image/jpeg", "image/png", "image/webp"],
  docMimes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
};

export const VERIFICATION_VALIDITY_MONTHS = 12;
