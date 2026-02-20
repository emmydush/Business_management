-- Add disbursement-related columns to payrolls table
ALTER TABLE payrolls
    ADD COLUMN IF NOT EXISTS disbursement_provider VARCHAR(50),
    ADD COLUMN IF NOT EXISTS disbursement_reference VARCHAR(200),
    ADD COLUMN IF NOT EXISTS disbursement_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS disbursement_amount NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS disbursement_currency VARCHAR(10) DEFAULT 'EUR',
    ADD COLUMN IF NOT EXISTS disbursed_at TIMESTAMP WITHOUT TIME ZONE,
    ADD COLUMN IF NOT EXISTS disbursement_metadata JSONB;

-- Index for quick lookup by reference
CREATE INDEX IF NOT EXISTS idx_payrolls_disbursement_reference ON payrolls(disbursement_reference);
