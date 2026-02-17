-- Migration script to add 'partially_paid' to the invoicestatus enum type
-- This fixes the error: invalid input value for enum invoicestatus: "partially_paid"

-- First, check if the value already exists to avoid errors
DO $$
DECLARE
    val_exists BOOLEAN;
BEGIN
    val_exists := EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'partially_paid' 
        AND enumtypid = 'invoicestatus'::regtype
    );
    
    IF NOT val_exists THEN
        ALTER TYPE invoicestatus ADD VALUE 'partially_paid';
    END IF;
END $$;
