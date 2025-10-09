-- QUICK FIX: Run this SQL directly in Railway's database console
-- This adds the missing office_type and office_number columns to the users table

-- Add office_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'office_type'
    ) THEN
        ALTER TABLE users ADD COLUMN office_type TEXT DEFAULT 'hot_desk';
        RAISE NOTICE 'Added office_type column to users table';
    ELSE
        RAISE NOTICE 'office_type column already exists';
    END IF;
END $$;

-- Add office_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'office_number'
    ) THEN
        ALTER TABLE users ADD COLUMN office_number TEXT;
        RAISE NOTICE 'Added office_number column to users table';
    ELSE
        RAISE NOTICE 'office_number column already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('office_type', 'office_number');






