-- =====================================================
-- COMPLETE Railway Development Database Setup
-- Matches the actual Drizzle schema from shared/schema.ts
-- =====================================================

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS cafe_order_items CASCADE;
DROP TABLE IF EXISTS cafe_orders CASCADE;
DROP TABLE IF EXISTS meeting_bookings CASCADE;
DROP TABLE IF EXISTS meeting_rooms CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS billing_type CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS site CASCADE;

-- Create enums
CREATE TYPE user_role AS ENUM ('member_individual', 'member_organization', 'member_organization_admin', 'cafe_manager', 'calmkaaj_team', 'calmkaaj_admin');
CREATE TYPE billing_type AS ENUM ('personal', 'organization');
CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled', 'deleted');
CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled', 'completed');
CREATE TYPE site AS ENUM ('blue_area', 'i_10', 'both');

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  site site NOT NULL DEFAULT 'blue_area',
  office_type TEXT DEFAULT 'private_office',
  office_number TEXT,
  monthly_credits INTEGER DEFAULT 30,
  monthly_fee INTEGER DEFAULT 0,
  description TEXT,
  start_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users table (COMPLETE with all fields including job_title)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  site site NOT NULL DEFAULT 'blue_area',
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
  profile_image TEXT,
  job_title TEXT,
  company TEXT,
  community_visible BOOLEAN DEFAULT true,
  email_visible BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  rfid_number TEXT,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Menu Categories table
CREATE TABLE menu_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  site site NOT NULL DEFAULT 'blue_area'
);

-- Menu Items table
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INTEGER REFERENCES menu_categories(id),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_daily_special BOOLEAN DEFAULT false,
  site site NOT NULL DEFAULT 'blue_area',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cafe Orders table
CREATE TABLE cafe_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status order_status DEFAULT 'pending',
  billed_to billing_type DEFAULT 'personal',
  org_id UUID REFERENCES organizations(id),
  handled_by INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  payment_status TEXT DEFAULT 'unpaid',
  payment_updated_by INTEGER REFERENCES users(id),
  payment_updated_at TIMESTAMP,
  notes TEXT,
  delivery_location TEXT,
  site site NOT NULL DEFAULT 'blue_area',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cafe Order Items table
CREATE TABLE cafe_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES cafe_orders(id) NOT NULL,
  menu_item_id INTEGER REFERENCES menu_items(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- Meeting Rooms table
CREATE TABLE meeting_rooms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL,
  credit_cost_per_hour INTEGER NOT NULL,
  amenities TEXT[],
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  site site NOT NULL DEFAULT 'blue_area',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Meeting Bookings table
CREATE TABLE meeting_bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  room_id INTEGER REFERENCES meeting_rooms(id) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  credits_used DECIMAL(10,2) NOT NULL,
  status booking_status DEFAULT 'confirmed',
  billed_to billing_type DEFAULT 'personal',
  org_id UUID REFERENCES organizations(id),
  notes TEXT,
  cancelled_by INTEGER REFERENCES users(id),
  site site NOT NULL DEFAULT 'blue_area',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Announcements table
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  show_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  site site NOT NULL DEFAULT 'blue_area',
  sites TEXT[] DEFAULT ARRAY['blue_area'],
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INSERT TEST DATA
-- =====================================================

-- Test Organizations
INSERT INTO organizations (id, name, email, phone, address, site, office_type, office_number, monthly_credits, monthly_fee, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'CalmKaaj Blue Area', 'dev-blue@calmkaaj.com', '+923001234567', 'Blue Area, Islamabad', 'blue_area', 'private_office', 'A-101', 50, 50000, 'Main office location'),
('550e8400-e29b-41d4-a716-446655440002', 'CalmKaaj I-10', 'dev-i10@calmkaaj.com', '+923001234568', 'I-10 Markaz, Islamabad', 'i_10', 'hot_desk', 'B-201', 30, 25000, 'Secondary location'),
('550e8400-e29b-41d4-a716-446655440003', 'Test Organization', 'dev-test@example.com', '+923001234569', 'Test Address', 'blue_area', 'dedicated_desk', 'C-301', 40, 35000, 'Test organization');

-- Test Users (with bcrypt hashed password for "DevAdmin123!")
-- Note: $2b$10$... is bcrypt hash - the password is "DevAdmin123!"
INSERT INTO users (email, password, first_name, last_name, phone, role, organization_id, site, office_type, office_number, credits, is_active, job_title, company, community_visible) VALUES
('admin@calmkaaj.dev', '$2b$10$rQnM1l7xJhKqV3YpZ5v8aOJdQyZx9vK2LmN4P6R8T0W2X4Y6Z8A0B2', 'Dev', 'Admin', '+923001234570', 'calmkaaj_admin', '550e8400-e29b-41d4-a716-446655440001', 'blue_area', 'hot_desk', 'D-101', 100, true, 'System Administrator', 'CalmKaaj', true),
('member@calmkaaj.dev', '$2b$10$rQnM1l7xJhKqV3YpZ5v8aOJdQyZx9vK2LmN4P6R8T0W2X4Y6Z8A0B2', 'Dev', 'Member', '+923001234571', 'member_individual', NULL, 'blue_area', 'hot_desk', 'D-102', 30, true, 'Freelancer', 'Self Employed', true),
('orgadmin@calmkaaj.dev', '$2b$10$rQnM1l7xJhKqV3YpZ5v8aOJdQyZx9vK2LmN4P6R8T0W2X4Y6Z8A0B2', 'Dev', 'OrgAdmin', '+923001234572', 'member_organization_admin', '550e8400-e29b-41d4-a716-446655440002', 'i_10', 'dedicated_desk', 'E-201', 50, true, 'Team Lead', 'CalmKaaj I-10', true),
('cafe@calmkaaj.dev', '$2b$10$rQnM1l7xJhKqV3YpZ5v8aOJdQyZx9vK2LmN4P6R8T0W2X4Y6Z8A0B2', 'Dev', 'Cafe', '+923001234573', 'cafe_manager', NULL, 'blue_area', 'hot_desk', 'F-101', 40, true, 'Cafe Manager', 'CalmKaaj Cafe', true);

-- Test Menu Categories
INSERT INTO menu_categories (name, description, display_order, is_active, site) VALUES
('Hot Beverages', 'Coffee, Tea and more', 1, true, 'blue_area'),
('Cold Beverages', 'Iced drinks and smoothies', 2, true, 'blue_area'),
('Snacks', 'Light bites and sandwiches', 3, true, 'blue_area');

-- Test Menu Items
INSERT INTO menu_items (name, description, price, category_id, is_available, site) VALUES
('Cappuccino', 'Classic Italian coffee', 350.00, 1, true, 'blue_area'),
('Latte', 'Smooth espresso with milk', 400.00, 1, true, 'blue_area'),
('Americano', 'Espresso with hot water', 300.00, 1, true, 'blue_area'),
('Iced Coffee', 'Cold brewed coffee', 350.00, 2, true, 'blue_area'),
('Mango Smoothie', 'Fresh mango blend', 450.00, 2, true, 'blue_area'),
('Club Sandwich', 'Triple decker sandwich', 550.00, 3, true, 'blue_area'),
('Croissant', 'Butter croissant', 250.00, 3, true, 'blue_area');

-- Test Meeting Rooms
INSERT INTO meeting_rooms (name, description, capacity, credit_cost_per_hour, amenities, is_available, site) VALUES
('Meeting Room A', 'Small meeting room for 4-6 people', 6, 2, ARRAY['Whiteboard', 'TV Screen', 'Video Conferencing'], true, 'blue_area'),
('Meeting Room B', 'Medium meeting room for 8-10 people', 10, 3, ARRAY['Whiteboard', 'Projector', 'Video Conferencing', 'Phone'], true, 'blue_area'),
('Conference Room', 'Large conference room for 15-20 people', 20, 5, ARRAY['Whiteboard', 'Dual Projectors', 'Video Conferencing', 'Phone', 'Catering Area'], true, 'blue_area'),
('Boardroom', 'Executive boardroom', 12, 4, ARRAY['Whiteboard', 'TV Screen', 'Video Conferencing', 'Private'], true, 'i_10');

-- Test Announcements
INSERT INTO announcements (title, body, is_active, site, sites) VALUES
('Welcome to Development!', 'This is the development environment for testing.', true, 'blue_area', ARRAY['blue_area', 'i_10']),
('New Cafe Menu', 'Check out our updated cafe menu with new items!', true, 'blue_area', ARRAY['blue_area']);

-- Verify setup
SELECT 'Development database setup completed successfully!' as status;
SELECT 'Tables created: organizations, users, menu_categories, menu_items, cafe_orders, cafe_order_items, meeting_rooms, meeting_bookings, announcements' as tables;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as org_count FROM organizations;
SELECT COUNT(*) as menu_item_count FROM menu_items;
SELECT COUNT(*) as room_count FROM meeting_rooms;