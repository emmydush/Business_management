-- Migration to update employees table structure
-- Remove user_id foreign key and add employee personal information fields

-- Add new columns
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(50) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS last_name VARCHAR(50) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS email VARCHAR(120) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Update existing records with placeholder data (you'll need to update these manually)
UPDATE employees 
SET first_name = 'Employee', 
    last_name = 'Staff', 
    email = 'employee@example.com'
WHERE first_name = '' OR first_name IS NULL;

-- Remove the user_id foreign key constraint
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_user_id_fkey;

-- Remove the user_id column
ALTER TABLE employees DROP COLUMN IF EXISTS user_id;

-- Drop the existing unique constraint
ALTER TABLE employees DROP CONSTRAINT IF EXISTS _business_employee_id_uc;

-- Add the new unique constraint
ALTER TABLE employees ADD CONSTRAINT _business_employee_id_uc UNIQUE (business_id, employee_id);