-- Create cfis_db on the shared self-hosted Postgres cluster.
-- Runs on first Postgres init only (idempotent).
-- This replaces CFIS' previous Supabase tenancy. See
-- documentations/launch/CFIS_DB_MIGRATION.md for the cutover plan.

SELECT 'CREATE DATABASE cfis_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cfis_db')\gexec
