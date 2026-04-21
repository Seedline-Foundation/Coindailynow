DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_available_extensions
		WHERE name = 'timescaledb'
	) THEN
		CREATE EXTENSION IF NOT EXISTS timescaledb;
		RAISE NOTICE 'timescaledb extension enabled';
	ELSE
		RAISE NOTICE 'timescaledb extension is not available in this PostgreSQL image; skipping';
	END IF;
END $$;
