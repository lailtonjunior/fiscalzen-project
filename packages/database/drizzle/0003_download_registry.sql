CREATE TABLE IF NOT EXISTS "download_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"job_id" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"format" varchar(10) NOT NULL,
	"include_metadata" boolean DEFAULT true NOT NULL,
	"organizacao" varchar(30) DEFAULT 'by-date' NOT NULL,
	"estimated_documents" integer DEFAULT 0,
	"processed_documents" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"filters" jsonb,
	"document_ids" jsonb,
	"result" jsonb,
	"download_url" varchar(2000),
	"error_message" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now(),
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "download_registry" ADD CONSTRAINT "download_registry_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_download_registry_tenant_created" ON "download_registry" ("tenant_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_download_registry_tenant_status" ON "download_registry" ("tenant_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_download_registry_job_id" ON "download_registry" ("job_id");
