-- Fix user_id column in employees table to be nullable
-- This allows creating employee records without associated user accounts

-- SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table
CREATE TABLE employees_new (
    id INTEGER PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id),
    branch_id INTEGER REFERENCES branches(id),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    employee_id VARCHAR(20) NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    department VARCHAR(100),
    position VARCHAR(100),
    hire_date DATE,
    salary NUMERIC(10, 2),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    bank_account VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    UNIQUE (business_id, employee_id),
    UNIQUE (user_id)
);

-- Copy data from old table to new table
INSERT INTO employees_new (
    id, business_id, branch_id, user_id, employee_id, department_id, 
    department, position, hire_date, salary, address, emergency_contact_name, 
    emergency_contact_phone, bank_account, is_active, created_at, updated_at
)
SELECT 
    id, business_id, branch_id, user_id, employee_id, department_id, 
    department, position, hire_date, salary, address, emergency_contact_name, 
    emergency_contact_phone, bank_account, is_active, created_at, updated_at
FROM employees;

-- Drop old table
DROP TABLE employees;

-- Rename new table to original name
ALTER TABLE employees_new RENAME TO employees;
