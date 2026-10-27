import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  customType,
  uniqueIndex,
  index,
  smallint,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const roleEnum = pgEnum("role", ["cliente", "profesional", "admin"]);
export const verificationStatusEnum = pgEnum("verification_status", [
  "pendiente",
  "en_revision",
  "verificado",
  "rechazado",
]);
export const planEnum = pgEnum("plan", ["gratis", "premium"]);
export const availabilityEnum = pgEnum("availability", ["hoy", "esta_semana", "a_coordinar"]);
export const docTypeEnum = pgEnum("doc_type", ["dni_frente", "dni_dorso", "selfie", "matricula"]);
export const docStatusEnum = pgEnum("doc_status", ["pendiente", "aprobado", "rechazado"]);
export const fileKindEnum = pgEnum("file_kind", ["verificacion", "pedido", "reclamo", "avatar"]);
export const urgencyEnum = pgEnum("urgency", ["baja", "media", "urgente"]);
export const requestStatusEnum = pgEnum("request_status", [
  "solicitado",
  "presupuestado",
  "contratado",
  "cancelado",
]);
export const quoteStatusEnum = pgEnum("quote_status", [
  "solicitada",
  "enviada",
  "aceptada",
  "rechazada",
  "descartada",
]);
export const jobStatusEnum = pgEnum("job_status", [
  "contratado",
  "en_curso",
  "finalizado",
  "calificado",
  "en_reclamo",
]);
export const moderationEnum = pgEnum("moderation_status", ["publicada", "en_revision", "oculta"]);
export const claimStatusEnum = pgEnum("claim_status", ["abierto", "en_mediacion", "resuelto", "cerrado"]);
export const claimReasonEnum = pgEnum("claim_reason", [
  "trabajo_mal_hecho",
  "incumplimiento_plazo",
  "precio_distinto",
  "no_se_presento",
  "danos",
  "trato_inadecuado",
  "otro",
]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: roleEnum("role").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  isDemo: boolean("is_demo").notNull().default(false),
  suspended: boolean("suspended").notNull().default(false),
  createdAt: createdAt(),
});

export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  secondary: boolean("secondary").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: fileKindEnum("kind").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    originalName: text("original_name"),
    data: bytea("data").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("files_owner_idx").on(t.ownerId)],
);

export const professionalProfiles = pgTable("professional_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  tradeTitle: text("trade_title").notNull().default(""),
  categories: text("categories").array().notNull().default([]),
  bio: text("bio").notNull().default(""),
  yearsExperience: integer("years_experience").notNull().default(0),
  zones: text("zones").array().notNull().default([]),
  referencePrice: integer("reference_price"),
  priceUnit: text("price_unit").notNull().default("visita"),
  availability: availabilityEnum("availability").notNull().default("esta_semana"),
  licenseNumber: text("license_number"),
  avatarFileId: uuid("avatar_file_id"),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("pendiente"),
  verificationSubmittedAt: timestamp("verification_submitted_at", { withTimezone: true }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verificationExpiresAt: timestamp("verification_expires_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  externalVerificationRef: text("external_verification_ref"),
  plan: planEnum("plan").notNull().default("gratis"),
  createdAt: createdAt(),
});

export const verificationDocuments = pgTable("verification_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  professionalId: uuid("professional_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: docTypeEnum("type").notNull(),
  fileId: uuid("file_id")
    .notNull()
    .references(() => files.id, { onDelete: "cascade" }),
  status: docStatusEnum("status").notNull().default("pendiente"),
  adminNotes: text("admin_notes"),
  createdAt: createdAt(),
});

export const serviceRequests = pgTable(
  "service_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categorySlug: text("category_slug")
      .notNull()
      .references(() => categories.slug),
    title: text("title").notNull(),
    description: text("description").notNull(),
    zone: text("zone").notNull(),
    urgency: urgencyEnum("urgency").notNull().default("media"),
    desiredDate: date("desired_date"),
    photoIds: uuid("photo_ids").array().notNull().default([]),
    status: requestStatusEnum("status").notNull().default("solicitado"),
    createdAt: createdAt(),
  },
  (t) => [index("requests_client_idx").on(t.clientId)],
);

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => serviceRequests.id, { onDelete: "cascade" }),
    professionalId: uuid("professional_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: quoteStatusEnum("status").notNull().default("solicitada"),
    price: integer("price"),
    durationText: text("duration_text"),
    availableFrom: date("available_from"),
    message: text("message"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("quotes_request_pro_uq").on(t.requestId, t.professionalId),
    index("quotes_pro_idx").on(t.professionalId),
  ],
);

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .unique()
    .references(() => serviceRequests.id, { onDelete: "cascade" }),
  quoteId: uuid("quote_id")
    .notNull()
    .unique()
    .references(() => quotes.id),
  clientId: uuid("client_id")
    .notNull()
    .references(() => users.id),
  professionalId: uuid("professional_id")
    .notNull()
    .references(() => users.id),
  status: jobStatusEnum("status").notNull().default("contratado"),
  hiredAt: timestamp("hired_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => serviceRequests.id, { onDelete: "cascade" }),
    // Cada pedido tiene un hilo por profesional consultado.
    professionalId: uuid("professional_id")
      .notNull()
      .references(() => users.id),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("messages_thread_idx").on(t.requestId, t.professionalId)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .unique()
      .references(() => jobs.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id),
    professionalId: uuid("professional_id")
      .notNull()
      .references(() => users.id),
    rating: smallint("rating").notNull(),
    comment: text("comment").notNull(),
    tags: text("tags").array().notNull().default([]),
    moderationStatus: moderationEnum("moderation_status").notNull().default("publicada"),
    flagReason: text("flag_reason"),
    createdAt: createdAt(),
  },
  (t) => [index("reviews_pro_idx").on(t.professionalId)],
);

export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => users.id),
  professionalId: uuid("professional_id")
    .notNull()
    .references(() => users.id),
  reason: claimReasonEnum("reason").notNull(),
  description: text("description").notNull(),
  photoIds: uuid("photo_ids").array().notNull().default([]),
  status: claimStatusEnum("status").notNull().default("abierto"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const claimEvents = pgTable("claim_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id")
    .notNull()
    .references(() => claims.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id),
  status: claimStatusEnum("status").notNull(),
  note: text("note").notNull(),
  visibleToClient: boolean("visible_to_client").notNull().default(true),
  createdAt: createdAt(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
  createdAt: createdAt(),
});

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    userId: uuid("user_id"),
    anonId: text("anon_id"),
    props: jsonb("props").$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index("analytics_name_idx").on(t.name, t.createdAt)],
);

export const emailLog = pgTable("email_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  createdAt: createdAt(),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull(),
  message: text("message").notNull(),
  createdAt: createdAt(),
});

export type User = typeof users.$inferSelect;
export type ProfessionalProfile = typeof professionalProfiles.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
