-- Add missing fields to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS office_type TEXT DEFAULT 'private_office',
ADD COLUMN IF NOT EXISTS office_number TEXT,
ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS monthly_fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT;
