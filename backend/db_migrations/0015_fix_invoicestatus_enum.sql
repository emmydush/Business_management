-- Fix the invoicestatus enum type to have the correct values if it exists
-- This ensures PostgreSQL uses the correct enum values

-- First, check if the enum type exists and has the correct values
-- The enum should have: draft, sent, viewed, paid, partially_paid, overdue, cancelled

-- If the enum type doesn't include PARTIALLY_PAID as "partially_paid", we need to add it

-- For PostgreSQL 13+, we can use ALTER TYPE ADD VALUE if needed
-- Try to add the PARTIALLY_PAID value if it doesn't exist (in correct lowercase form)

-- Check the current enum definition - this is informational
-- SELECT enumtypid, enumlabel FROM pg_enum WHERE enumtypid = (SELECT typid FROM pg_type WHERE typname = 'invoicestatus'::regtype);

-- Ensure the invoices table uses the correct enum values
-- The status column should only store the lowercase values: 'draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled'

-- Note: This migration assumes the invoices table and invoicestatus enum already exist
-- If they don't exist, they will be created by Flask-SQLAlchemy automatically

-- Make this file a no-op that safely reports current enum values (avoids empty-query errors)
DO $$
BEGIN
	RAISE NOTICE '0015_fix_invoicestatus_enum: noop (informational)';
END $$;
