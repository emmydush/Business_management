-- Add image column to products table
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS image VARCHAR(255);
