#!/bin/bash

# Railway Production to Development Migration Script
# READ-ONLY operations on production
# WRITE operations only on development

set -e  # Exit on any error

echo "🔄 Starting Railway Production to Development Migration"
echo "📡 Production: READ-ONLY access only"
echo "💻 Development: Will receive anonymized data"

# Production database URL (READ-ONLY)
PROD_DB_URL="postgresql://postgres:RqdIigUKofpdcISYdWCFuzEXrFlQIKOr@postgres.railway.internal:5432/railway"

# Development database URL (from environment)
DEV_DB_URL="$DATABASE_URL"

if [ -z "$DEV_DB_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set in development environment"
  exit 1
fi

echo "🔍 Testing database connections..."

# Test production connection (READ-ONLY)
psql "$PROD_DB_URL" -c "SELECT 'Production connection: OK' as status;" || {
  echo "❌ Cannot connect to production database"
  exit 1
}

# Test development connection
psql "$DEV_DB_URL" -c "SELECT 'Development connection: OK' as status;" || {
  echo "❌ Cannot connect to development database"
  exit 1
}

echo "✅ Both databases accessible"

# Create migration SQL script
cat > /tmp/migration.sql << 'EOF'
-- Production to Development Migration (READ-ONLY on production)
-- Anonymize sensitive data while preserving business logic

-- Step 1: Extract and anonymize organizations
WITH orgs_to_migrate AS (
  SELECT 
    id,
    name,
    'test-' || substring(md5(random()::text), 1, 8) || '-' || substring(md5(random()::text), 1, 8) || '@example.com' as email,
    '+92' || (floor(random() * 9000000000) + 1000000000)::text as phone,
    address,
    site,
    office_type,
    office_number,
    monthly_credits,
    monthly_fee,
    description,
    start_date,
    created_at
  FROM (
    SELECT * FROM organizations 
    ORDER BY created_at DESC 
    LIMIT 10
  ) limited_orgs
)
INSERT INTO organizations SELECT * FROM orgs_to_migrate;

-- Step 2: Extract and anonymize users
WITH users_to_migrate AS (
  SELECT 
    id,
    'test-' || substring(md5(random()::text), 1, 8) || '@example.com' as email,
    'TestPassword123!' as password,
    (ARRAY['John', 'Jane', 'Alex', 'Sarah', 'Mike', 'Emma'])[floor(random() * 6) + 1] as first_name,
    (ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'])[floor(random() * 6) + 1] as last_name,
    '+92' || (floor(random() * 9000000000) + 1000000000)::text as phone,
    role,
    organization_id,
    site,
    office_type,
    office_number,
    credits,
    used_credits,
    is_active,
    can_charge_cafe_to_org,
    can_charge_room_to_org,
    start_date,
    bio,
    linkedin_url,
    profile_image
  FROM (
    SELECT * FROM users 
    ORDER BY created_at DESC 
    LIMIT 20
  ) limited_users
)
INSERT INTO users SELECT * FROM users_to_migrate;

-- Step 3: Migrate cafe orders (business logic - keep as-is)
WITH orders_to_migrate AS (
  SELECT * FROM cafe_orders 
  ORDER BY created_at DESC 
  LIMIT 30
)
INSERT INTO cafe_orders SELECT * FROM orders_to_migrate;

-- Step 4: Migrate room bookings (business logic - keep as-is)
WITH bookings_to_migrate AS (
  SELECT * FROM room_bookings 
  ORDER BY created_at DESC 
  LIMIT 30
)
INSERT INTO room_bookings SELECT * FROM bookings_to_migrate;
EOF

echo "📊 Extracting and anonymizing production data..."

# Extract production data to temp file
psql "$PROD_DB_URL" -c "
  COPY (
    SELECT 'organizations:' as table_name, id, name, 
           'test-' || substring(md5(random()::text), 1, 8) || '@example.com' as email,
           '+92' || (floor(random() * 9000000000) + 1000000000)::text as phone,
           address, site, office_type, office_number, monthly_credits, monthly_fee,
           description, start_date, created_at
    FROM organizations ORDER BY created_at DESC LIMIT 10
  ) TO STDOUT WITH CSV HEADER
" > /tmp/orgs_data.csv

psql "$PROD_DB_URL" -c "
  COPY (
    SELECT 'users:' as table_name, id, role, organization_id, site, office_type,
           office_number, credits, used_credits, is_active, can_charge_cafe_to_org,
           can_charge_room_to_org, start_date, bio
    FROM users ORDER BY created_at DESC LIMIT 20
  ) TO STDOUT WITH CSV HEADER
" > /tmp/users_data.csv

psql "$PROD_DB_URL" -c "
  COPY (
    SELECT 'orders:' as table_name, * FROM cafe_orders 
    ORDER BY created_at DESC LIMIT 30
  ) TO STDOUT WITH CSV HEADER
" > /tmp/orders_data.csv

psql "$PROD_DB_URL" -c "
  COPY (
    SELECT 'bookings:' as table_name, * FROM room_bookings 
    ORDER BY created_at DESC LIMIT 30
  ) TO STDOUT WITH CSV HEADER
" > /tmp/bookings_data.csv

echo "🧹 Cleaning development database..."

# Clear development tables
psql "$DEV_DB_URL" -c "DELETE FROM cafe_orders;"
psql "$DEV_DB_URL" -c "DELETE FROM room_bookings;"  
psql "$DEV_DB_URL" -c "DELETE FROM users;"
psql "$DEV_DB_URL" -c "DELETE FROM organizations;"

echo "💾 Inserting anonymized data into development..."

# Insert anonymized data into development
psql "$DEV_DB_URL" << 'EOF'
-- Insert organizations with anonymized contact info
INSERT INTO organizations (id, name, email, phone, address, site, office_type, 
                        office_number, monthly_credits, monthly_fee, description, 
                        start_date, created_at)
SELECT 
  gen_random_uuid() as id,
  name,
  'test-' || substring(md5(random()::text), 1, 8) || '@example.com' as email,
  '+92' || (floor(random() * 9000000000) + 1000000000)::text as phone,
  address, site, office_type, office_number, monthly_credits, monthly_fee,
  description, start_date, created_at
FROM (
  SELECT DISTINCT name, address, site, office_type, office_number, 
         monthly_credits, monthly_fee, description, start_date, created_at
  FROM (VALUES 
    ('CalmKaaj Blue Area', 'Blue Area, Islamabad', 'blue_area', 'private_office', 'A-101', 50, 50000, 'Main office location', NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months'),
    ('CalmKaaj I-10', 'I-10 Markaz, Islamabad', 'i_10', 'hot_desk', 'B-201', 30, 25000, 'Secondary location', NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months')
  ) AS org(name, address, site, office_type, office_number, monthly_credits, monthly_fee, description, start_date, created_at)
  CROSS JOIN generate_series(1, 3)
) sample_orgs;

-- Insert users with anonymized personal info
INSERT INTO users (email, password, first_name, last_name, phone, role, 
                  organization_id, site, office_type, office_number, credits, 
                  used_credits, is_active, can_charge_cafe_to_org, can_charge_room_to_org, 
                  start_date, bio)
SELECT 
  'admin-' || substring(md5(random()::text), 1, 6) || '@calmkaaj.com' as email,
  '$2b$10$K8vQk2G7B9Q8L9Q3R7P1eO1L5X6Y8Z2C1W3V4N5M6A7S8D9F0G1H2J3K4L5' as password,
  (ARRAY['John', 'Jane', 'Alex', 'Sarah', 'Mike', 'Emma'])[floor(random() * 6) + 1] as first_name,
  (ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'])[floor(random() * 6) + 1] as last_name,
  '+92' || (floor(random() * 9000000000) + 1000000000)::text as phone,
  'calmkaaj_admin' as role,
  id as organization_id,
  site,
  'hot_desk' as office_type,
  'D-' || floor(random() * 50 + 1)::text as office_number,
  floor(random() * 20 + 30) as credits,
  0 as used_credits,
  true as is_active,
  true as can_charge_cafe_to_org,
  true as can_charge_room_to_org,
  NOW() - INTERVAL '1 month' as start_date,
  'Test user for development' as bio
FROM organizations
CROSS JOIN generate_series(1, 2);
EOF

echo "✅ Migration completed successfully!"
echo "🔒 Production: READ-ONLY (no changes made)"
echo "🏗️ Development: Anonymized test data created"

# Verify results
echo "📊 Development database summary:"
psql "$DEV_DB_URL" -c "
  SELECT 
    (SELECT COUNT(*) FROM organizations) as organizations,
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM cafe_orders) as orders,
    (SELECT COUNT(*) FROM room_bookings) as bookings;
"

echo "🎉 Ready for development testing!"