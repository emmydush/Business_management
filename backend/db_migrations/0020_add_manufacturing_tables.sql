-- Manufacturing Tables

-- Bill of Materials
CREATE TABLE IF NOT EXISTS bills_of_materials (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    total_material_cost DECIMAL(12, 2) DEFAULT 0,
    total_labor_cost DECIMAL(12, 2) DEFAULT 0,
    total_overhead DECIMAL(12, 2) DEFAULT 0,
    total_cost DECIMAL(12, 2) DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BOM Items
CREATE TABLE IF NOT EXISTS bom_items (
    id SERIAL PRIMARY KEY,
    bom_id INTEGER REFERENCES bills_of_materials(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'pcs',
    scrap_percent DECIMAL(5, 2) DEFAULT 0,
    sequence INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Production Orders
CREATE TABLE IF NOT EXISTS production_orders (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    bom_id INTEGER REFERENCES bills_of_materials(id) ON DELETE SET NULL,
    order_number VARCHAR(50) UNIQUE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    priority VARCHAR(50) DEFAULT 'normal',
    scheduled_start DATE,
    scheduled_end DATE,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    notes TEXT,
    total_material_cost DECIMAL(12, 2) DEFAULT 0,
    total_labor_cost DECIMAL(12, 2) DEFAULT 0,
    total_cost DECIMAL(12, 2) DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Production Materials (material consumption)
CREATE TABLE IF NOT EXISTS production_materials (
    id SERIAL PRIMARY KEY,
    production_order_id INTEGER REFERENCES production_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity_required DECIMAL(10, 2) NOT NULL,
    quantity_consumed DECIMAL(10, 2) DEFAULT 0,
    warehouse_id INTEGER REFERENCES warehouses(id),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Production Operations (work center operations)
CREATE TABLE IF NOT EXISTS production_operations (
    id SERIAL PRIMARY KEY,
    production_order_id INTEGER REFERENCES production_orders(id) ON DELETE CASCADE,
    work_center VARCHAR(100),
    operation_name VARCHAR(255),
    sequence INTEGER DEFAULT 0,
    planned_hours DECIMAL(6, 2) DEFAULT 0,
    actual_hours DECIMAL(6, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    operator_id INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Manufacturing tables
CREATE INDEX IF NOT EXISTS idx_bom_product ON bills_of_materials(product_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_date ON production_orders(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_production_materials_order ON production_materials(production_order_id);
