-- Add missing user_id column to employees table
ALTER TABLE employees ADD COLUMN user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE;
