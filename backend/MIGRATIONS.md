Tenant-scoped username/email uniqueness

This repository does not use Alembic migrations. To change username/email uniqueness to be tenant-scoped we added a SQL migration file and helper scripts.

Files:
- db_migrations/0001_tenant_username_email_unique.sql  -- SQL that drops the global unique constraints and adds per-business unique constraints + partial indexes for superadmin accounts (business_id IS NULL).
- scripts/check_user_duplicates.py -- quick script to detect duplicates per business before applying migration.
- scripts/upgrade_user_uniqueness.py -- executes the migration SQL using the Flask app context.

Important:
1) Run `python scripts/check_user_duplicates.py` first; fix or remove duplicates before applying the migration.
2) Then run `python scripts/upgrade_user_uniqueness.py` to apply changes.
3) Backup DB before applying migrations.

Notes:
- Login ambiguity: allowing identical usernames in different businesses means the login flow needs tenant context (e.g., business subdomain/email) to fully disambiguate users. Consider requiring business identifier at login.
