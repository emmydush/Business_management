-- Make customer_id nullable in invoices table to support walk-in customers
-- This migration allows invoices to be created without requiring a customer
-- which is needed for POS sales and walk-in customers

ALTER TABLE invoices ALTER COLUMN customer_id DROP NOT NULL;
