-- Add slug to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);

-- Update existing businesses with slugs
UPDATE businesses SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL;
