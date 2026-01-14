-- FiscalZen Database Initialization Script
-- This script runs when the PostgreSQL container is first created

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schema for partitioned tables
-- (actual tables will be created by Drizzle migrations)

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE fiscalzen TO fiscalzen;

-- Set timezone
SET timezone = 'America/Sao_Paulo';

-- Confirm initialization
DO $$
BEGIN
    RAISE NOTICE 'FiscalZen database initialized successfully!';
END $$;
