
CREATE INDEX IF NOT EXISTS "idx_documents_tenant_date" ON "documents" ("tenant_id","data_emissao");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_company_type_serie_numero" ON "documents" ("company_id","doc_type","serie","numero");