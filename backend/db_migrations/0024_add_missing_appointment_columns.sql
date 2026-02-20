-- Add missing columns to appointments table to match the model
-- This migration adds columns that were defined in the model but missing from the initial migration

-- Add branch_id column
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL;

-- Add appointment_id column (for custom appointment IDs)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_id VARCHAR(20);

-- Add user_id column (who created the appointment)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add title column
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS title VARCHAR(200);

-- Add duration_minutes column
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

-- Add is_recurring column
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Add recurring_pattern column
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurring_pattern VARCHAR(50);

-- Add reminder_sent column
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- Add confirmation_sent column
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmation_sent BOOLEAN DEFAULT false;

-- Convert status column to enum if not already (PostgreSQL specific)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'appointmentstatus'
    ) THEN
        CREATE TYPE appointmentstatus AS ENUM (
            'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
        );
    END IF;
    
    -- Convert VARCHAR to enum if the column is still VARCHAR
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'status' AND data_type = 'character varying'
    ) THEN
        ALTER TABLE appointments ALTER COLUMN status TYPE appointmentstatus USING status::appointmentstatus;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Type already exists, ignore
        NULL;
END
$$;

-- Create index on business_id for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);

-- Create index on branch_id for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_branch_id ON appointments(branch_id);

-- Create index on user_id for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
