-- EMERGENCY FIX: Sync all employees with their organization's office_type and office_number
-- This will update ALL employees to match their organization's settings

UPDATE users AS u
SET 
  office_type = o.office_type,
  office_number = o.office_number
FROM organizations AS o
WHERE 
  u.organization_id = o.id
  AND u.organization_id IS NOT NULL;

-- Verify the update worked
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.role,
  o.name AS organization_name,
  u.office_type AS employee_office_type,
  o.office_type AS org_office_type,
  u.office_number AS employee_office_number,
  o.office_number AS org_office_number
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.organization_id IS NOT NULL
ORDER BY o.name, u.first_name;

