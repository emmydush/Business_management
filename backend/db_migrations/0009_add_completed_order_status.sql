-- Add 'COMPLETED' value to the orderstatus enum
-- This migration adds the missing 'COMPLETED' status to the orderstatus enum

ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'COMPLETED';