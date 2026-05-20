-- Editorial role taxonomy (PRE_POST_LAUNCH_TODO §107)
-- Adds CEO, EDITOR, JOURNALIST, CONTRIBUTOR to UserRole enum.
-- Postgres enum ALTER cannot run inside a transaction; Prisma handles this
-- because the enum already lives in a separate non-transactional migration.

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CONTRIBUTOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'JOURNALIST';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'EDITOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CEO';
