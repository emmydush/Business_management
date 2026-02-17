-- Add extended business fields for comprehensive registration
ALTER TABLE businesses ADD COLUMN registration_number VARCHAR(50);
ALTER TABLE businesses ADD COLUMN tax_id VARCHAR(50);
ALTER TABLE businesses ADD COLUMN industry VARCHAR(100);
ALTER TABLE businesses ADD COLUMN company_size VARCHAR(20) DEFAULT 'small';
ALTER TABLE businesses ADD COLUMN website VARCHAR(255);
ALTER TABLE businesses ADD COLUMN description TEXT;
ALTER TABLE businesses ADD COLUMN business_type VARCHAR(50);
ALTER TABLE businesses ADD COLUMN country VARCHAR(100);
ALTER TABLE businesses ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE businesses ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE businesses ADD COLUMN logo VARCHAR(255);
ALTER TABLE businesses ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN verified_at TIMESTAMP;
