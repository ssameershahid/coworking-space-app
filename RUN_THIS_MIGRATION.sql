-- CalmKaaj Database Migration
-- Run this to add office_type and office_number fields to users table

-- Add office_type column (Space Selected dropdown)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS office_type TEXT DEFAULT 'hot_desk';

-- Add office_number column (Office/Desk Number input)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS office_number TEXT;

-- Verify the migration was successful
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('office_type', 'office_number')
ORDER BY column_name;

-- Show sample of data to confirm columns exist
SELECT 
    id, 
    email, 
    office_type, 
    office_number 
FROM users 
LIMIT 5;

