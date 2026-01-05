-- Add approval columns to users table
-- This migration adds the approval_status, approved_by, and approved_at columns to the users table

-- Add the approval_status column with default value 'PENDING'
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'PENDING' NOT NULL;

-- Add the approved_by column
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);

-- Add the approved_at column
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS approved_at DATE;

-- Update any existing users with 'approved' status to the correct enum value 'APPROVED'
UPDATE users 
SET approval_status = 'APPROVED' 
WHERE approval_status = 'approved';