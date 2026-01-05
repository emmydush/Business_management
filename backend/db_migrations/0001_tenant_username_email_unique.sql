-- Migration: Make username/email uniqueness tenant-scoped
-- 1) Drop global unique constraints if they exist
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- 2) Add unique constraints for (business_id, username) and (business_id, email)
ALTER TABLE users ADD CONSTRAINT _business_username_uc UNIQUE (business_id, username);
ALTER TABLE users ADD CONSTRAINT _business_email_uc UNIQUE (business_id, email);

-- 3) For superadmin/global users (business_id IS NULL), enforce unique username/email
-- (Postgres partial unique indexes)
CREATE UNIQUE INDEX IF NOT EXISTS users_superadmin_username_uniq ON users (username) WHERE business_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_superadmin_email_uniq ON users (email) WHERE business_id IS NULL;

-- IMPORTANT: Run the duplicates pre-check before applying this migration to avoid failures.
-- Examples to detect duplicates:
-- SELECT username, business_id, count(*) FROM users GROUP BY username, business_id HAVING count(*) > 1;
-- SELECT email, business_id, count(*) FROM users GROUP BY email, business_id HAVING count(*) > 1;
