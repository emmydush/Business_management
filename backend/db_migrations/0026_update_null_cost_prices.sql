-- Migration: Update NULL cost_price to 0.0
-- Date: 2026-02-20
-- Description: Ensures all products have a cost_price value for accurate COGS calculations

UPDATE products 
SET cost_price = 0.0 
WHERE cost_price IS NULL;
