-- Migration: 0012_add_failed_login_attempts_to_users
-- Description: Add failed_login_attempts and locked_until columns to users table
-- Date: 2026-02-16

ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
