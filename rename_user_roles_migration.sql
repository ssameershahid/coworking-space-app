-- Migration script to rename user roles
-- This script updates all existing user role values in the database

BEGIN;

-- Update existing user roles to new names
UPDATE users 
SET role = CASE 
    WHEN role = 'member_individual' THEN 'individual_member'
    WHEN role = 'member_organization' THEN 'organization_member'
    WHEN role = 'member_organization_admin' THEN 'organization_admin'
    ELSE role
END
WHERE role IN ('member_individual', 'member_organization', 'member_organization_admin');

-- Drop the old enum type and create new one
-- Note: This requires dropping and recreating the enum type

-- Step 1: Add a temporary column with the new enum values
ALTER TABLE users ADD COLUMN role_new TEXT;

-- Step 2: Copy the updated role values to the temporary column
UPDATE users SET role_new = role::text;

-- Step 3: Drop the old role column
ALTER TABLE users DROP COLUMN role;

-- Step 4: Drop the old enum type
DROP TYPE IF EXISTS user_role;

-- Step 5: Create the new enum type with updated values
CREATE TYPE user_role AS ENUM (
    'individual_member',
    'organization_member', 
    'organization_admin',
    'cafe_manager',
    'calmkaaj_team',
    'calmkaaj_admin'
);

-- Step 6: Recreate the role column with the new enum type
ALTER TABLE users ADD COLUMN role user_role;

-- Step 7: Copy values back from the temporary column, mapping to new enum
UPDATE users 
SET role = role_new::user_role;

-- Step 8: Drop the temporary column
ALTER TABLE users DROP COLUMN role_new;

-- Step 9: Make the role column NOT NULL again
ALTER TABLE users ALTER COLUMN role SET NOT NULL;

COMMIT;

-- Verification query - run this after migration to verify changes
-- SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;
