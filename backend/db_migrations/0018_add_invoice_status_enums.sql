-- Migration: Add missing invoicestatus enum values
-- This ensures: 'sent', 'viewed', 'overdue' are available in invoicestatus enum

DO $$
DECLARE
    sent_exists BOOLEAN;
    viewed_exists BOOLEAN;
    overdue_exists BOOLEAN;
BEGIN
    sent_exists := EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'sent'
        AND enumtypid = 'invoicestatus'::regtype
    );

    viewed_exists := EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'viewed'
        AND enumtypid = 'invoicestatus'::regtype
    );

    overdue_exists := EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'overdue'
        AND enumtypid = 'invoicestatus'::regtype
    );

    IF NOT sent_exists THEN
        RAISE NOTICE 'Adding ''sent'' to invoicestatus enum';
        ALTER TYPE invoicestatus ADD VALUE 'sent';
    END IF;

    IF NOT viewed_exists THEN
        RAISE NOTICE 'Adding ''viewed'' to invoicestatus enum';
        ALTER TYPE invoicestatus ADD VALUE 'viewed';
    END IF;

    IF NOT overdue_exists THEN
        RAISE NOTICE 'Adding ''overdue'' to invoicestatus enum';
        ALTER TYPE invoicestatus ADD VALUE 'overdue';
    END IF;
END $$;
