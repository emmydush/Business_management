-- Add new fields to company_profiles table
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS fiscal_year_start VARCHAR(2) DEFAULT '01';
