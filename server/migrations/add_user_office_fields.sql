-- Add office_type and office_number fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS office_type TEXT DEFAULT 'hot_desk',
ADD COLUMN IF NOT EXISTS office_number TEXT;

