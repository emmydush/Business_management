-- Add customer_name column to orders table for walk-in customers
-- Migration: 0031_add_customer_name_to_orders.sql
-- Date: 2026-03-21

ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255);

-- Add index for better performance on customer_name queries
CREATE INDEX idx_orders_customer_name ON orders(customer_name) WHERE customer_name IS NOT NULL;
