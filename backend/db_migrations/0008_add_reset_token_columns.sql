-- Migration: Add reset_token columns to users table
-- Description: Add columns for password reset functionality

ALTER TABLE users 
ADD COLUMN reset_token VARCHAR(100) NULL,
ADD COLUMN reset_token_expiry TIMESTAMP NULL;