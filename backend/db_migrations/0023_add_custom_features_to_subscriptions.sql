-- Add custom_features column to subscriptions table
-- This allows superadmins to customize features for individual subscriptions

ALTER TABLE subscriptions 
ADD COLUMN custom_features JSON;

-- Set default value to NULL (will use plan features by default)
ALTER TABLE subscriptions 
ALTER COLUMN custom_features SET DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_custom_features 
ON subscriptions(custom_features);
