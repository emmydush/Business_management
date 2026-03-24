-- Make customer_id column nullable in orders table
-- Migration: 0032_make_customer_id_nullable.sql
-- Date: 2026-03-21

-- Drop the NOT NULL constraint from customer_id column
-- Note: SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table

BEGIN TRANSACTION;

-- Create new orders table with nullable customer_id
CREATE TABLE orders_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    branch_id INTEGER,
    order_id VARCHAR(20) NOT NULL,
    customer_id INTEGER,  -- Made nullable
    customer_name VARCHAR(255),
    user_id INTEGER NOT NULL,
    order_date DATE DEFAULT CURRENT_DATE,
    required_date DATE,
    shipped_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
    subtotal NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    shipping_cost NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    total_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (business_id) REFERENCES businesses (id),
    FOREIGN KEY (branch_id) REFERENCES branches (id),
    FOREIGN KEY (customer_id) REFERENCES customers (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Copy data from old table to new table
INSERT INTO orders_new (
    id, business_id, branch_id, order_id, customer_id, customer_name, user_id,
    order_date, required_date, shipped_date, status, subtotal, tax_amount,
    discount_amount, shipping_cost, total_amount, notes, is_active, created_at, updated_at
)
SELECT 
    id, business_id, branch_id, order_id, customer_id, customer_name, user_id,
    order_date, required_date, shipped_date, status, subtotal, tax_amount,
    discount_amount, shipping_cost, total_amount, notes, is_active, created_at, updated_at
FROM orders;

-- Drop old table
DROP TABLE orders;

-- Rename new table to orders
ALTER TABLE orders_new RENAME TO orders;

-- Recreate indexes
CREATE UNIQUE INDEX _business_order_id_uc ON orders(business_id, order_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_customer_name ON orders(customer_name) WHERE customer_name IS NOT NULL;

COMMIT;
