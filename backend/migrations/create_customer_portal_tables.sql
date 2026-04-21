-- Customer Portal Database Schema
-- E-commerce Customer Management System

-- ========================================
-- 1. CUSTOMERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_customers_email (email),
    INDEX idx_customers_active (is_active),
    INDEX idx_customers_created (created_at)
);

-- ========================================
-- 2. CUSTOMER ADDRESSES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS customer_addresses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'Rwanda',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_addresses_customer (customer_id),
    INDEX idx_addresses_default (is_default)
);

-- ========================================
-- 3. CUSTOMER CART TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS customer_cart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (customer_id, product_id),
    INDEX idx_cart_customer (customer_id),
    INDEX idx_cart_product (product_id)
);

-- ========================================
-- 4. CUSTOMER ORDERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS customer_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    delivery_address_id INT NOT NULL,
    payment_method_id INT NULL,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RWF',
    notes TEXT NULL,
    tracking_number VARCHAR(100) NULL,
    estimated_delivery DATE NULL,
    delivered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (delivery_address_id) REFERENCES customer_addresses(id) ON DELETE RESTRICT,
    INDEX idx_orders_customer (customer_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_number (order_number),
    INDEX idx_orders_tracking (tracking_number),
    INDEX idx_orders_created (created_at)
);

-- ========================================
-- 5. CUSTOMER ORDER ITEMS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS customer_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES customer_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id)
);

-- ========================================
-- 6. CUSTOMER WISHLIST TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS customer_wishlist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_wishlist_item (customer_id, product_id),
    INDEX idx_wishlist_customer (customer_id),
    INDEX idx_wishlist_product (product_id)
);

-- ========================================
-- 7. DELIVERY TRACKING TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS delivery_tracking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    status ENUM('order_placed', 'order_confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'failed_delivery') NOT NULL,
    location VARCHAR(255) NULL,
    description TEXT NULL,
    tracking_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NULL, -- Staff member who updated the status
    
    FOREIGN KEY (order_id) REFERENCES customer_orders(id) ON DELETE CASCADE,
    INDEX idx_tracking_order (order_id),
    INDEX idx_tracking_status (status),
    INDEX idx_tracking_timestamp (tracking_timestamp)
);

-- ========================================
-- 8. CUSTOMER REVIEWS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS customer_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    order_id INT NULL, -- Link to the order that contains the product
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NULL,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES customer_orders(id) ON DELETE SET NULL,
    UNIQUE KEY unique_review (customer_id, product_id),
    INDEX idx_reviews_product (product_id),
    INDEX idx_reviews_customer (customer_id),
    INDEX idx_reviews_rating (rating),
    INDEX idx_reviews_public (is_public)
);

-- ========================================
-- 9. CUSTOMER PAYMENT METHODS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS customer_payment_methods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    method_type ENUM('credit_card', 'debit_card', 'mobile_money', 'bank_transfer', 'cash_on_delivery') NOT NULL,
    provider VARCHAR(100) NULL, -- e.g., 'Visa', 'Mastercard', 'MTN', 'Airtel'
    last_four VARCHAR(4) NULL,
    expiry_month INT NULL,
    expiry_year INT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_payment_customer (customer_id),
    INDEX idx_payment_default (is_default),
    INDEX idx_payment_active (is_active)
);

-- ========================================
-- 10. CUSTOMER SESSIONS TABLE (for authentication)
-- ========================================
CREATE TABLE IF NOT EXISTS customer_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_info TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_sessions_customer (customer_id),
    INDEX idx_sessions_token (token_hash),
    INDEX idx_sessions_expires (expires_at),
    INDEX idx_sessions_active (is_active)
);

-- ========================================
-- 11. PRODUCT CATEGORIES (for customer portal)
-- ========================================
CREATE TABLE IF NOT EXISTS product_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    parent_id INT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    INDEX idx_categories_parent (parent_id),
    INDEX idx_categories_slug (slug),
    INDEX idx_categories_active (is_active),
    INDEX idx_categories_sort (sort_order)
);

-- ========================================
-- 12. CATEGORY PRODUCT RELATIONSHIP
-- ========================================
CREATE TABLE IF NOT EXISTS product_category_relations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_category_product (product_id, category_id),
    INDEX idx_category_product (category_id, product_id)
);

-- ========================================
-- TRIGGERS AND STORED PROCEDURES
-- ========================================

-- Trigger to update customer's last_login timestamp
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_customer_last_login 
AFTER INSERT ON customer_sessions 
FOR EACH ROW 
BEGIN
    UPDATE customers 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE id = NEW.customer_id;
END//
DELIMITER ;

-- Trigger to ensure only one default address per customer
DELIMITER //
CREATE TRIGGER IF NOT EXISTS ensure_single_default_address 
BEFORE INSERT ON customer_addresses 
FOR EACH ROW 
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE customer_addresses 
        SET is_default = FALSE 
        WHERE customer_id = NEW.customer_id AND is_default = TRUE;
    END IF;
END//
DELIMITER ;

-- Trigger to ensure only one default payment method per customer
DELIMITER //
CREATE TRIGGER IF NOT EXISTS ensure_single_default_payment 
BEFORE INSERT ON customer_payment_methods 
FOR EACH ROW 
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE customer_payment_methods 
        SET is_default = FALSE 
        WHERE customer_id = NEW.customer_id AND is_default = TRUE;
    END IF;
END//
DELIMITER ;

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- View for customer order summaries
CREATE OR REPLACE VIEW customer_order_summary AS
SELECT 
    co.id,
    co.order_number,
    co.customer_id,
    c.full_name as customer_name,
    c.email as customer_email,
    co.status,
    co.total_amount,
    co.currency,
    co.created_at,
    ca.address as delivery_address,
    ca.city,
    ca.postal_code,
    co.tracking_number,
    co.estimated_delivery
FROM customer_orders co
JOIN customers c ON co.customer_id = c.id
JOIN customer_addresses ca ON co.delivery_address_id = ca.id;

-- View for product ratings summary
CREATE OR REPLACE VIEW product_rating_summary AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    COUNT(cr.id) as review_count,
    AVG(cr.rating) as average_rating,
    COUNT(CASE WHEN cr.is_verified_purchase = TRUE THEN 1 END) as verified_purchase_count
FROM products p
LEFT JOIN customer_reviews cr ON p.id = cr.product_id AND cr.is_public = TRUE
GROUP BY p.id, p.name;

-- ========================================
-- SAMPLE DATA INSERTION (for testing)
-- ========================================

-- Insert sample product categories
INSERT IGNORE INTO product_categories (name, slug, description) VALUES
('Electronics', 'electronics', 'Electronic devices and gadgets'),
('Furniture', 'furniture', 'Home and office furniture'),
('Appliances', 'appliances', 'Home appliances and electronics'),
('Clothing', 'clothing', 'Fashion and apparel'),
('Books', 'books', 'Books and educational materials'),
('Sports', 'sports', 'Sports and fitness equipment');

-- ========================================
-- INDEX OPTIMIZATIONS
-- ========================================

-- Composite indexes for common queries
CREATE INDEX idx_orders_customer_status ON customer_orders(customer_id, status);
CREATE INDEX idx_orders_status_created ON customer_orders(status, created_at);
CREATE INDEX idx_reviews_product_rating ON customer_reviews(product_id, rating);
CREATE INDEX idx_cart_customer_product ON customer_cart(customer_id, product_id);

-- Full-text indexes for search functionality
ALTER TABLE products ADD FULLTEXT(name, description);
ALTER TABLE customer_orders ADD FULLTEXT(order_number, notes);

-- ========================================
-- SECURITY AND CONSTRAINTS
-- ========================================

-- Add check constraints for data integrity
ALTER TABLE customer_orders 
ADD CONSTRAINT chk_total_amount CHECK (total_amount >= 0),
ADD CONSTRAINT chk_subtotal CHECK (subtotal >= 0),
ADD CONSTRAINT chk_shipping_cost CHECK (shipping_cost >= 0);

ALTER TABLE customer_order_items 
ADD CONSTRAINT chk_quantity CHECK (quantity > 0),
ADD CONSTRAINT chk_unit_price CHECK (unit_price >= 0),
ADD CONSTRAINT chk_total_price CHECK (total_price >= 0);

ALTER TABLE customer_cart 
ADD CONSTRAINT chk_cart_quantity CHECK (quantity > 0);

-- ========================================
-- PERFORMANCE OPTIMIZATION
-- ========================================

-- Partition large tables if needed (example for orders)
-- This can be enabled when the table grows large
-- ALTER TABLE customer_orders PARTITION BY RANGE (YEAR(created_at)) (
--     PARTITION p2023 VALUES LESS THAN (2024),
--     PARTITION p2024 VALUES LESS THAN (2025),
--     PARTITION p2025 VALUES LESS THAN (2026),
--     PARTITION p_future VALUES LESS THAN MAXVALUE
-- );

-- ========================================
-- CLEANUP PROCEDURES
-- ========================================

-- Procedure to clean expired sessions
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CleanExpiredSessions()
BEGIN
    DELETE FROM customer_sessions 
    WHERE expires_at < CURRENT_TIMESTAMP OR is_active = FALSE;
END//
DELIMITER ;

-- Procedure to update product ratings
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS UpdateProductRatings(IN product_id_param INT)
BEGIN
    UPDATE products p
    SET 
        rating_count = (
            SELECT COUNT(*) 
            FROM customer_reviews cr 
            WHERE cr.product_id = product_id_param AND cr.is_public = TRUE
        ),
        average_rating = (
            SELECT AVG(cr.rating) 
            FROM customer_reviews cr 
            WHERE cr.product_id = product_id_param AND cr.is_public = TRUE
        )
    WHERE p.id = product_id_param;
END//
DELIMITER ;

-- ========================================
-- FINAL NOTES
-- ========================================

-- This schema provides:
-- 1. Complete customer management system
-- 2. Shopping cart functionality
-- 3. Order processing and tracking
-- 4. Product reviews and ratings
-- 5. Payment method management
-- 6. Delivery tracking system
-- 7. Session management for authentication
-- 8. Performance optimizations
-- 9. Data integrity constraints
-- 10. Comprehensive indexing

-- All tables are designed to work with the existing business management system
-- and can be integrated with the current inventory and product management.
