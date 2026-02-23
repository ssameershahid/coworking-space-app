-- Railway Development Database Setup SQL
-- Creates tables and test data for development environment

-- Clear any existing data
DELETE FROM cafe_orders IF EXISTS;
DELETE FROM room_bookings IF EXISTS;  
DELETE FROM users IF EXISTS;
DELETE FROM organizations IF EXISTS;

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  site TEXT NOT NULL DEFAULT 'blue_area',
  office_type TEXT DEFAULT 'hot_desk',
  office_number TEXT,
  monthly_credits INTEGER DEFAULT 30,
  monthly_fee INTEGER DEFAULT 0,
  description TEXT,
  start_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  site TEXT NOT NULL DEFAULT 'blue_area',
  office_type TEXT DEFAULT 'hot_desk',
  office_number TEXT,
  credits INTEGER DEFAULT 30,
  used_credits DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  can_charge_cafe_to_org BOOLEAN DEFAULT false,
  can_charge_room_to_org BOOLEAN DEFAULT true,
  start_date TIMESTAMP DEFAULT NOW(),
  bio TEXT,
  linkedin_url TEXT,
  profile_image TEXT
);

-- Create cafe_orders table
CREATE TABLE IF NOT EXISTS cafe_orders (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  status TEXT NOT NULL,
  order_type TEXT NOT NULL,
  delivery_location TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create room_bookings table
CREATE TABLE IF NOT EXISTS room_bookings (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  room_name TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status TEXT NOT NULL,
  total_credits INTEGER NOT NULL,
  purpose TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert test organizations
INSERT INTO organizations (id, name, email, phone, address, site, office_type, office_number, monthly_credits, monthly_fee, description, start_date, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'CalmKaaj Blue Area', 'dev-blue@calmkaaj.com', '+923001234567', 'Blue Area, Islamabad', 'blue_area', 'private_office', 'A-101', 50, 50000, 'Main office location', NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months'),
('550e8400-e29b-41d4-a716-446655440002', 'CalmKaaj I-10', 'dev-i10@calmkaaj.com', '+923001234568', 'I-10 Markaz, Islamabad', 'i_10', 'hot_desk', 'B-201', 30, 25000, 'Secondary location', NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months'),
('550e8400-e29b-41d4-a716-446655440003', 'Test Organization', 'dev-test@example.com', '+923001234569', 'Test Address', 'blue_area', 'dedicated_desk', 'C-301', 40, 35000, 'Test organization for development', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months');

-- Insert test users
INSERT INTO users (email, password, first_name, last_name, phone, role, organization_id, site, office_type, office_number, credits, used_credits, is_active, can_charge_cafe_to_org, can_charge_room_to_org, start_date, bio) VALUES
('admin@calmkaaj.dev', '$2b$10$K8vQk2G7B9Q8L9Q3R7P1eO1L5X6Y8Z2C1W3V4N5M6A7S8D9F0G1H2J3K4L5', 'Dev', 'Admin', '+923001234570', 'calmkaaj_admin', '550e8400-e29b-41d4-a716-446655440001', 'blue_area', 'hot_desk', 'D-101', 100, 0, true, true, true, NOW() - INTERVAL '1 month', 'Development admin user'),
('member@calmkaaj.dev', '$2b$10$K8vQk2G7B9Q8L9Q3R7P1eO1L5X6Y8Z2C1W3V4N5M6A7S8D9F0G1H2J3K4L5', 'Dev', 'Member', '+923001234571', 'member_individual', NULL, 'blue_area', 'hot_desk', 'D-102', 30, 5, true, false, false, NOW() - INTERVAL '1 month', 'Development individual member'),
('orgadmin@calmkaaj.dev', '$2b$10$K8vQk2G7B9Q8L9Q3R7P1eO1L5X6Y8Z2C1W3V4N5M6A7S8D9F0G1H2J3K4L5', 'Dev', 'OrgAdmin', '+923001234572', 'member_organization_admin', '550e8400-e29b-41d4-a716-446655440002', 'i_10', 'dedicated_desk', 'E-201', 50, 10, true, true, true, NOW() - INTERVAL '1 month', 'Development organization admin'),
('cafe@calmkaaj.dev', '$2b$10$K8vQk2G7B9Q8L9Q3R7P1eO1L5X6Y8Z2C1W3V4N5M6A7S8D9F0G1H2J3K4L5', 'Dev', 'Cafe', '+923001234573', 'cafe_manager', NULL, 'blue_area', 'hot_desk', 'F-101', 40, 0, true, false, false, NOW() - INTERVAL '1 month', 'Development cafe manager');

-- Test data confirmation
SELECT 'Development database setup completed successfully!' as status;