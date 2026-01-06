-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    asset_tag VARCHAR(50) UNIQUE,
    description TEXT,
    value NUMERIC(10, 2),
    status VARCHAR(20) DEFAULT 'Available',
    assigned_to INTEGER,
    assigned_date DATE,
    purchase_date DATE,
    warranty_expiry DATE,
    location VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_assets_business_id ON assets(business_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);