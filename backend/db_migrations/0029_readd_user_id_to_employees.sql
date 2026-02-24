-- Re-add user_id column and foreign key to employees table
-- This restores compatibility with the Employee SQLAlchemy model,
-- which expects a user_id field and relationship to users.

-- 1) Add user_id column back (nullable to avoid issues with existing rows)
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- 2) Add foreign key constraint to users table
-- If the constraint already exists, the migration runner will treat the
-- \"already exists\" error as a non-fatal skip.
ALTER TABLE employees
ADD CONSTRAINT employees_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3) Ensure user_id is unique when present (one employee per user)
ALTER TABLE employees
ADD CONSTRAINT employees_user_id_key
UNIQUE (user_id);

