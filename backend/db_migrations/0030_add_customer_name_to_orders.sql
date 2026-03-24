-- Add customer_name column to orders table
-- For walk-in customers in POS sales

ALTER TABLE orders 
ADD COLUMN customer_name VARCHAR(255);

-- Make customer_id nullable to allow walk-in customers
ALTER TABLE orders 
ALTER COLUMN customer_id DROP NOT NULL;

-- Set default customer_name for existing orders with NULL customer_name
UPDATE orders 
SET customer_name = 'Walk-in Customer' 
WHERE customer_name IS NULL AND customer_id IS NOT NULL;
