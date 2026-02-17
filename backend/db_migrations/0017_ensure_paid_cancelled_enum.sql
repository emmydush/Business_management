-- Migration: ensure 'paid' and 'cancelled' exist in invoicestatus enum
-- This prevents: invalid input value for enum invoicestatus: "paid"

DO $$
DECLARE
    paid_exists BOOLEAN;
    cancelled_exists BOOLEAN;
BEGIN
    paid_exists := EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'paid'
        AND enumtypid = 'invoicestatus'::regtype
    );

    cancelled_exists := EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'cancelled'
        AND enumtypid = 'invoicestatus'::regtype
    );

    IF NOT paid_exists THEN
        RAISE NOTICE 'Adding ''paid'' to invoicestatus enum';
        ALTER TYPE invoicestatus ADD VALUE 'paid';
    END IF;

    IF NOT cancelled_exists THEN
        RAISE NOTICE 'Adding ''cancelled'' to invoicestatus enum';
        ALTER TYPE invoicestatus ADD VALUE 'cancelled';
    END IF;
END $$;
