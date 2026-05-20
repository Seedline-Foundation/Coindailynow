#!/usr/bin/env bash
# Create the dedicated CFIS role and apply schema/grants on first Postgres init.
# Reads CFIS_DB_PASSWORD from env (set in your top-level .env or compose env).
set -euo pipefail

# Default to a clearly-flagged dev password if the operator didn't set one.
CFIS_PASSWORD="${CFIS_DB_PASSWORD:-cfis_dev_password_change_me}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cfis') THEN
      EXECUTE format('CREATE ROLE cfis WITH LOGIN PASSWORD %L', '${CFIS_PASSWORD}');
    ELSE
      EXECUTE format('ALTER ROLE cfis WITH LOGIN PASSWORD %L', '${CFIS_PASSWORD}');
    END IF;
  END
  \$\$;

  GRANT ALL PRIVILEGES ON DATABASE cfis_db TO cfis;
EOSQL

# Ensure schemas/extensions exist inside cfis_db itself.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "cfis_db" <<-EOSQL
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  GRANT ALL ON SCHEMA public TO cfis;
EOSQL

echo "[initdb] cfis_db + role 'cfis' provisioned."
