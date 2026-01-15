CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cnpj" varchar(14) NOT NULL,
	"razao_social" varchar(255),
	"nome_fantasia" varchar(255),
	"uf" varchar(2),
	"inscricao_estadual" varchar(20),
	"inscricao_municipal" varchar(20),
	"codigo_municipio" varchar(7),
	"settings" jsonb DEFAULT '{}'::jsonb,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"cnpj" varchar(14),
	"plan" varchar(50) DEFAULT 'starter',
	"settings" jsonb DEFAULT '{}'::jsonb,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tenants_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_seq" integer,
	"event_date" timestamp with time zone,
	"protocol" varchar(50),
	"description" text,
	"xml_storage_key" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"doc_type" varchar(20) NOT NULL,
	"chave" varchar(44),
	"numero" integer,
	"serie" integer,
	"emit_cnpj" varchar(14),
	"emit_razao" varchar(255),
	"dest_cnpj_cpf" varchar(14),
	"dest_razao" varchar(255),
	"valor_total" numeric(15, 2),
	"data_emissao" date NOT NULL,
	"data_autorizacao" timestamp with time zone,
	"data_captura" timestamp with time zone DEFAULT now(),
	"situacao" varchar(20) DEFAULT 'autorizada',
	"xml_storage_key" varchar(255),
	"xml_hash_sha256" varchar(64),
	"xml_size_bytes" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"search_content" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100),
	"machine_id" varchar(100),
	"last_heartbeat" timestamp with time zone,
	"version" varchar(20),
	"status" varchar(20) DEFAULT 'offline',
	"ip_address" varchar(45),
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"details" jsonb,
	"ip_address" "inet",
	"user_agent" varchar(500),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monitor_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"job_type" varchar(50) NOT NULL,
	"last_nsu" varchar(25),
	"last_run" timestamp with time zone,
	"next_run" timestamp with time zone,
	"status" varchar(20) DEFAULT 'pending',
	"error_count" varchar(10) DEFAULT '0',
	"last_error" varchar(500),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nsu_control" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"doc_type" varchar(10) NOT NULL,
	"last_nsu" varchar(15) DEFAULT '000000000000000' NOT NULL,
	"max_nsu" varchar(15),
	"last_sync" timestamp with time zone,
	"next_sync" timestamp with time zone,
	"sync_status" varchar(20) DEFAULT 'idle',
	"error_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"last_error_at" timestamp with time zone,
	"total_documents_received" integer DEFAULT 0 NOT NULL,
	"last_document_received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "uq_nsu_control_company_doc_type" UNIQUE("company_id","doc_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nfse_configs" (
	"company_id" uuid NOT NULL,
	"codigo_municipio" varchar(7) NOT NULL,
	"nome_municipio" varchar(100) NOT NULL,
	"uf" varchar(2) NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"versao_abrasf" varchar(10),
	"is_active" boolean DEFAULT false NOT NULL,
	"rpa_login" text,
	"rpa_password" text,
	"inscricao_municipal" varchar(20),
	"last_sync" timestamp with time zone,
	"last_error" text,
	"sync_status" varchar(20) DEFAULT 'idle',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nfse_configs_company_id_codigo_municipio_pk" PRIMARY KEY("company_id","codigo_municipio")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_document_events_document_id" ON "document_events" ("document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_document_events_event_type" ON "document_events" ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_tenant_type" ON "documents" ("tenant_id","doc_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_company_date" ON "documents" ("company_id","data_emissao");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_chave" ON "documents" ("chave");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_emit_cnpj" ON "documents" ("emit_cnpj");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_dest_cnpj_cpf" ON "documents" ("dest_cnpj_cpf");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_data_emissao" ON "documents" ("data_emissao");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agents_tenant_id" ON "agents" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agents_machine_id" ON "agents" ("machine_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agents_status" ON "agents" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_tenant_id" ON "audit_logs" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id" ON "audit_logs" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs" ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity_type" ON "audit_logs" ("entity_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_monitor_jobs_company_id" ON "monitor_jobs" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_monitor_jobs_job_type" ON "monitor_jobs" ("job_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_monitor_jobs_next_run" ON "monitor_jobs" ("next_run");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_nsu_control_company_doc_type" ON "nsu_control" ("company_id","doc_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_nsu_control_next_sync" ON "nsu_control" ("next_sync");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_nsu_control_sync_status" ON "nsu_control" ("sync_status");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_events" ADD CONSTRAINT "document_events_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agents" ADD CONSTRAINT "agents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monitor_jobs" ADD CONSTRAINT "monitor_jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nsu_control" ADD CONSTRAINT "nsu_control_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nfse_configs" ADD CONSTRAINT "nfse_configs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
