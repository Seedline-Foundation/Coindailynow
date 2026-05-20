-- Create the listmonk database (runs on first Postgres init only)
SELECT 'CREATE DATABASE listmonk'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'listmonk')\gexec
