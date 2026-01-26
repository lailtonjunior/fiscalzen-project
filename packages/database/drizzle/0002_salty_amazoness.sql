CREATE TABLE IF NOT EXISTS "document_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source_document_id" uuid,
	"source_chave" varchar(44) NOT NULL,
	"source_type" varchar(10) NOT NULL,
	"target_document_id" uuid,
	"target_chave" varchar(44) NOT NULL,
	"target_type" varchar(10) NOT NULL,
	"relation_type" varchar(30) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_relation" UNIQUE("tenant_id","source_chave","target_chave","relation_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_tags" (
	"document_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "document_tags_document_id_tag_id_pk" PRIMARY KEY("document_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"color" varchar(7) DEFAULT '#6366f1' NOT NULL,
	"description" varchar(255),
	"icon" varchar(50),
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "unique_tag_slug" UNIQUE("tenant_id","slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_internal" boolean DEFAULT false,
	"parent_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid,
	"document_id" uuid,
	"type" varchar(20) NOT NULL,
	"priority" varchar(20) DEFAULT 'MEDIA',
	"title" varchar(255) NOT NULL,
	"message" text,
	"data" jsonb DEFAULT '{}'::jsonb,
	"lido" boolean DEFAULT false,
	"lido_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" uuid NOT NULL,
	"event" varchar(50) NOT NULL,
	"payload" jsonb NOT NULL,
	"response" jsonb,
	"status_code" integer,
	"attempt" integer DEFAULT 1,
	"success" boolean NOT NULL,
	"error_message" text,
	"executed_at" timestamp with time zone DEFAULT now(),
	"duration_ms" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"url" varchar(500) NOT NULL,
	"secret" varchar(64) NOT NULL,
	"events" jsonb NOT NULL,
	"headers" jsonb,
	"is_active" boolean DEFAULT true,
	"retry_policy" jsonb DEFAULT '{"maxAttempts":3,"backoffMs":5000}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "ambiente" varchar(1) DEFAULT '2';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "last_event_check" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "manifestacao" varchar(20);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "manifestacao_data" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "status_desacordo" varchar(1);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "data_desacordo" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "protocolo_desacordo" varchar(15);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "observacao_desacordo" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "pdf_storage_key" varchar(255);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_relations_source" ON "document_relations" ("tenant_id","source_document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_relations_target" ON "document_relations" ("tenant_id","target_document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_relations_source_chave" ON "document_relations" ("tenant_id","source_chave");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_relations_target_chave" ON "document_relations" ("tenant_id","target_chave");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_document_tags_doc" ON "document_tags" ("document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_document_tags_tag" ON "document_tags" ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comments_document" ON "comments" ("document_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_alerts_tenant" ON "alerts" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_alerts_unread" ON "alerts" ("tenant_id","lido");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_desacordo" ON "documents" ("tenant_id","status_desacordo");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_relations" ADD CONSTRAINT "document_relations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_relations" ADD CONSTRAINT "document_relations_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "documents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_relations" ADD CONSTRAINT "document_relations_target_document_id_documents_id_fk" FOREIGN KEY ("target_document_id") REFERENCES "documents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_tags" ADD CONSTRAINT "document_tags_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_tags" ADD CONSTRAINT "document_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tags" ADD CONSTRAINT "tags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alerts" ADD CONSTRAINT "alerts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alerts" ADD CONSTRAINT "alerts_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "webhooks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
