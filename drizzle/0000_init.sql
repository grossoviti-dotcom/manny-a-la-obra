CREATE TYPE "public"."availability" AS ENUM('hoy', 'esta_semana', 'a_coordinar');--> statement-breakpoint
CREATE TYPE "public"."claim_reason" AS ENUM('trabajo_mal_hecho', 'incumplimiento_plazo', 'precio_distinto', 'no_se_presento', 'danos', 'trato_inadecuado', 'otro');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('abierto', 'en_mediacion', 'resuelto', 'cerrado');--> statement-breakpoint
CREATE TYPE "public"."doc_status" AS ENUM('pendiente', 'aprobado', 'rechazado');--> statement-breakpoint
CREATE TYPE "public"."doc_type" AS ENUM('dni_frente', 'dni_dorso', 'selfie', 'matricula');--> statement-breakpoint
CREATE TYPE "public"."file_kind" AS ENUM('verificacion', 'pedido', 'reclamo', 'avatar');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('contratado', 'en_curso', 'finalizado', 'calificado', 'en_reclamo');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('publicada', 'en_revision', 'oculta');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('gratis', 'premium');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('solicitada', 'enviada', 'aceptada', 'rechazada', 'descartada');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('solicitado', 'presupuestado', 'contratado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('cliente', 'profesional', 'admin');--> statement-breakpoint
CREATE TYPE "public"."urgency" AS ENUM('baja', 'media', 'urgente');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pendiente', 'en_revision', 'verificado', 'rechazado');--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"user_id" uuid,
	"anon_id" text,
	"props" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"secondary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"actor_id" uuid,
	"status" "claim_status" NOT NULL,
	"note" text NOT NULL,
	"visible_to_client" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"reason" "claim_reason" NOT NULL,
	"description" text NOT NULL,
	"photo_ids" uuid[] DEFAULT '{}' NOT NULL,
	"status" "claim_status" DEFAULT 'abierto' NOT NULL,
	"resolution" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"topic" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"to" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"kind" "file_kind" NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"original_name" text,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"quote_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"status" "job_status" DEFAULT 'contratado' NOT NULL,
	"hired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_request_id_unique" UNIQUE("request_id"),
	CONSTRAINT "jobs_quote_id_unique" UNIQUE("quote_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "professional_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"trade_title" text DEFAULT '' NOT NULL,
	"categories" text[] DEFAULT '{}' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"years_experience" integer DEFAULT 0 NOT NULL,
	"zones" text[] DEFAULT '{}' NOT NULL,
	"reference_price" integer,
	"price_unit" text DEFAULT 'visita' NOT NULL,
	"availability" "availability" DEFAULT 'esta_semana' NOT NULL,
	"license_number" text,
	"avatar_file_id" uuid,
	"verification_status" "verification_status" DEFAULT 'pendiente' NOT NULL,
	"verification_submitted_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"verification_expires_at" timestamp with time zone,
	"rejection_reason" text,
	"external_verification_ref" text,
	"plan" "plan" DEFAULT 'gratis' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"status" "quote_status" DEFAULT 'solicitada' NOT NULL,
	"price" integer,
	"duration_text" text,
	"available_from" date,
	"message" text,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"comment" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"moderation_status" "moderation_status" DEFAULT 'publicada' NOT NULL,
	"flag_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"category_slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"zone" text NOT NULL,
	"urgency" "urgency" DEFAULT 'media' NOT NULL,
	"desired_date" date,
	"photo_ids" uuid[] DEFAULT '{}' NOT NULL,
	"status" "request_status" DEFAULT 'solicitado' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "role" NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"password_hash" text NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"suspended" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"type" "doc_type" NOT NULL,
	"file_id" uuid NOT NULL,
	"status" "doc_status" DEFAULT 'pendiente' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "claim_events" ADD CONSTRAINT "claim_events_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_events" ADD CONSTRAINT "claim_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_request_id_service_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_request_id_service_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_request_id_service_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_category_slug_categories_slug_fk" FOREIGN KEY ("category_slug") REFERENCES "public"."categories"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_name_idx" ON "analytics_events" USING btree ("name","created_at");--> statement-breakpoint
CREATE INDEX "files_owner_idx" ON "files" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "messages_thread_idx" ON "messages" USING btree ("request_id","professional_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_request_pro_uq" ON "quotes" USING btree ("request_id","professional_id");--> statement-breakpoint
CREATE INDEX "quotes_pro_idx" ON "quotes" USING btree ("professional_id");--> statement-breakpoint
CREATE INDEX "reviews_pro_idx" ON "reviews" USING btree ("professional_id");--> statement-breakpoint
CREATE INDEX "requests_client_idx" ON "service_requests" USING btree ("client_id");