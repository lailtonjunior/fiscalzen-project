CREATE TABLE "document_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"document_id" uuid,
	"company_id" uuid,
	"user_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"source" varchar(100) NOT NULL,
	"title" varchar(200) NOT NULL,
	"summary" varchar(500),
	"details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "document_history" ADD CONSTRAINT "document_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "document_history" ADD CONSTRAINT "document_history_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "document_history" ADD CONSTRAINT "document_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_document_history_tenant_created" ON "document_history" USING btree ("tenant_id","created_at");
--> statement-breakpoint
CREATE INDEX "idx_document_history_document_created" ON "document_history" USING btree ("document_id","created_at");
--> statement-breakpoint
CREATE INDEX "idx_document_history_company_created" ON "document_history" USING btree ("company_id","created_at");
--> statement-breakpoint
CREATE INDEX "idx_document_history_created_at" ON "document_history" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "idx_document_history_event_type" ON "document_history" USING btree ("event_type");
--> statement-breakpoint
CREATE INDEX "idx_document_history_source" ON "document_history" USING btree ("source");
