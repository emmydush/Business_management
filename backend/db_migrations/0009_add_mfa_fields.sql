-- Add MFA fields to users table
ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(32);
ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN mfa_backup_codes TEXT;
ALTER TABLE users ADD COLUMN mfa_backup_codes_used TEXT;

-- Add indexes for MFA fields
CREATE INDEX idx_users_mfa_enabled ON users(mfa_enabled);
CREATE INDEX idx_users_mfa_secret ON users(mfa_secret);
