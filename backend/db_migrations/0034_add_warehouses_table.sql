-- Add warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    warehouse_id VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    location TEXT,
    manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    capacity_percentage INTEGER DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    max_capacity INTEGER DEFAULT 10000,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create unique constraint for business-specific warehouse IDs
ALTER TABLE warehouses ADD CONSTRAINT _business_warehouse_id_uc UNIQUE (business_id, warehouse_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_warehouses_business_id ON warehouses(business_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_branch_id ON warehouses(branch_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_manager_id ON warehouses(manager_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status);
CREATE INDEX IF NOT EXISTS idx_warehouses_is_active ON warehouses(is_active);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_warehouses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER warehouses_updated_at_trigger
    BEFORE UPDATE ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION update_warehouses_updated_at();
