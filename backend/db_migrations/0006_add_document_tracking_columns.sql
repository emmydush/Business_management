-- Add view_count and download_count columns to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;