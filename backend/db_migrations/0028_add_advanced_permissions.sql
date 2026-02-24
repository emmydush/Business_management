-- Migration: Add advanced permissions support
-- For PostgreSQL database

-- 1. Add new columns to user_permissions table
ALTER TABLE user_permissions 
ADD COLUMN IF NOT EXISTS permissions JSON DEFAULT '[]',
ADD COLUMN IF NOT EXISTS granted_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- 2. Create permission_groups table
CREATE TABLE IF NOT EXISTS permission_groups (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSON DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, name)
);

-- 3. Create index for faster permission lookups
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_module ON user_permissions(user_id, module);
CREATE INDEX IF NOT EXISTS idx_permission_groups_business ON permission_groups(business_id);

-- 4. Migrate existing permissions data to new format
-- Convert old permission column to new JSON format if needed
UPDATE user_permissions 
SET permissions = '["view"]'::json
WHERE (permissions IS NULL OR permissions = '[]'::json OR permissions = 'null'::json)
AND permission IS NOT NULL;

-- 5. Add constraint to foreign key if needed
ALTER TABLE user_permissions 
ADD CONSTRAINT IF NOT EXISTS fk_user_permissions_granted_by 
FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL;

-- 6. Add comment
COMMENT ON COLUMN user_permissions.permissions IS 'JSON array of permission types: view, create, edit, delete, export, approve, all';
