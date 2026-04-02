-- Create event monitoring tables for comprehensive audit logging

-- Create event_logs table
CREATE TABLE IF NOT EXISTS event_logs (
    id VARCHAR(36) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    user_id VARCHAR(36),
    business_id VARCHAR(36),
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    description TEXT NOT NULL,
    details JSON,
    entity_type VARCHAR(100),
    entity_id VARCHAR(36),
    old_values JSON,
    new_values JSON,
    session_id VARCHAR(255),
    correlation_id VARCHAR(36) NOT NULL,
    source VARCHAR(50) DEFAULT 'application',
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create event_alerts table
CREATE TABLE IF NOT EXISTS event_alerts (
    id VARCHAR(36) PRIMARY KEY,
    business_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_category VARCHAR(50),
    event_type VARCHAR(100),
    severity VARCHAR(20),
    conditions JSON,
    notification_channels JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL
);

-- Create event_reports table
CREATE TABLE IF NOT EXISTS event_reports (
    id VARCHAR(36) PRIMARY KEY,
    business_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL,
    filters JSON,
    date_range_start TIMESTAMP NOT NULL,
    date_range_end TIMESTAMP NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    status VARCHAR(20) DEFAULT 'pending',
    generated_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for event_logs table
CREATE INDEX IF NOT EXISTS idx_event_logs_timestamp ON event_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_event_logs_category_severity ON event_logs(category, severity);
CREATE INDEX IF NOT EXISTS idx_event_logs_user_timestamp ON event_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_event_logs_business_timestamp ON event_logs(business_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_event_logs_entity ON event_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_correlation ON event_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_ip_timestamp ON event_logs(ip_address, timestamp);
CREATE INDEX IF NOT EXISTS idx_event_logs_event_type ON event_logs(event_type);

-- Create indexes for event_alerts table
CREATE INDEX IF NOT EXISTS idx_event_alerts_business_id ON event_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_event_alerts_active ON event_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_event_alerts_category ON event_alerts(event_category);
CREATE INDEX IF NOT EXISTS idx_event_alerts_created_by ON event_alerts(created_by);

-- Create indexes for event_reports table
CREATE INDEX IF NOT EXISTS idx_event_reports_business_id ON event_reports(business_id);
CREATE INDEX IF NOT EXISTS idx_event_reports_status ON event_reports(status);
CREATE INDEX IF NOT EXISTS idx_event_reports_type ON event_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_event_reports_created_by ON event_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_event_reports_date_range ON event_reports(date_range_start, date_range_end);

-- Add foreign key constraints
ALTER TABLE event_logs ADD CONSTRAINT fk_event_logs_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE event_logs ADD CONSTRAINT fk_event_logs_business_id 
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL;

ALTER TABLE event_alerts ADD CONSTRAINT fk_event_alerts_business_id 
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE event_alerts ADD CONSTRAINT fk_event_alerts_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE event_reports ADD CONSTRAINT fk_event_reports_business_id 
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE event_reports ADD CONSTRAINT fk_event_reports_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- Create trigger for updated_at in event_alerts
CREATE OR REPLACE FUNCTION update_event_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_event_alerts_updated_at
    BEFORE UPDATE ON event_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_event_alerts_updated_at();

-- Create view for event summary statistics
CREATE OR REPLACE VIEW event_summary AS
SELECT 
    category,
    event_type,
    severity,
    COUNT(*) as event_count,
    MAX(timestamp) as last_occurrence,
    MIN(timestamp) as first_occurrence
FROM event_logs
GROUP BY category, event_type, severity;

-- Create view for user activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.id as user_id,
    u.username,
    u.first_name,
    u.last_name,
    u.business_id,
    COUNT(el.id) as total_events,
    COUNT(CASE WHEN el.severity = 'critical' THEN 1 END) as critical_events,
    COUNT(CASE WHEN el.severity = 'high' THEN 1 END) as high_events,
    COUNT(CASE WHEN el.category = 'security' THEN 1 END) as security_events,
    MAX(el.timestamp) as last_activity
FROM users u
LEFT JOIN event_logs el ON u.id = el.user_id
GROUP BY u.id, u.username, u.first_name, u.last_name, u.business_id;

-- Create view for business event summary
CREATE OR REPLACE VIEW business_event_summary AS
SELECT 
    b.id as business_id,
    b.name as business_name,
    COUNT(el.id) as total_events,
    COUNT(CASE WHEN el.severity = 'critical' THEN 1 END) as critical_events,
    COUNT(CASE WHEN el.severity = 'high' THEN 1 END) as high_events,
    COUNT(CASE WHEN el.category = 'security' THEN 1 END) as security_events,
    COUNT(CASE WHEN el.category = 'business' THEN 1 END) as business_events,
    COUNT(CASE WHEN el.category = 'system' THEN 1 END) as system_events,
    MAX(el.timestamp) as last_activity,
    COUNT(DISTINCT el.user_id) as active_users
FROM businesses b
LEFT JOIN event_logs el ON b.id = el.business_id
GROUP BY b.id, b.name;
