-- Migration to ensure invoicestatus enum has all required values: draft, sent, viewed, paid, partially_paid, overdue, cancelled
-- This fixes: 'PAID' is not among the defined enum values

-- Add 'paid' if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'paid' 
        AND enumtypid = 'invoicestatus'::regtype
    ) THEN
        ALTER TYPE invoicestatus ADD VALUE 'paid';
    END IF;
END $$;

-- Add 'partially_paid' if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'partially_paid' 
        AND enumtypid = 'invoicestatus'::regtype
    ) THEN
        ALTER TYPE invoicestatus ADD VALUE 'partially_paid';
    END IF;
END $$;

-- Add 'overdue' if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'overdue' 
        AND enumtypid = 'invoicestatus'::regtype
    ) THEN
        ALTER TYPE invoicestatus ADD VALUE 'overdue';
    END IF;
END $$;
