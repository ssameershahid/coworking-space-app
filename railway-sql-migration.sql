-- Railway Database Migration SQL
-- Copy and paste this directly into Railway's PostgreSQL interface

-- Add missing columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS office_type TEXT DEFAULT 'private_office',
ADD COLUMN IF NOT EXISTS office_number TEXT,
ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS monthly_fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Verify the migration
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'organizations' 
ORDER BY ordinal_position;

-- Check organizations count
SELECT COUNT(*) as total_organizations FROM organizations;

-- Show sample organizations
SELECT * FROM organizations LIMIT 5;
