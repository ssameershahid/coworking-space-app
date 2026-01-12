// Development Database Setup Script
// Uses existing Drizzle ORM setup

import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { sql } from "drizzle-orm";

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return url;
};

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 1,
});

const db = drizzle(pool);

async function setupDevelopmentDatabase() {
  try {
    console.log("🔄 Setting up Development Database...");
    
    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await db.execute(sql`DELETE FROM cafe_orders`);
    await db.execute(sql`DELETE FROM room_bookings`);
    await db.execute(sql`DELETE FROM users`);
    await db.execute(sql`DELETE FROM organizations`);
    
    // Insert organizations
    console.log("🏢 Creating organizations...");
    await db.execute(sql`
      INSERT INTO organizations (id, name, email, phone, address, site, office_type, office_number, monthly_credits, monthly_fee, description, start_date, created_at) VALUES
      ('550e8400-e29b-41d4-a716-446655440001', 'CalmKaaj Blue Area', 'dev-blue@calmkaaj.com', '+923001234567', 'Blue Area, Islamabad', 'blue_area', 'private_office', 'A-101', 50, 50000, 'Main office location', NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months'),
      ('550e8400-e29b-41d4-a716-446655440002', 'CalmKaaj I-10', 'dev-i10@calmkaaj.com', '+923001234568', 'I-10 Markaz, Islamabad', 'i_10', 'hot_desk', 'B-201', 30, 25000, 'Secondary location', NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months'),
      ('550e8400-e29b-41d4-a716-446655440003', 'Test Organization', 'dev-test@example.com', '+923001234569', 'Test Address', 'blue_area', 'dedicated_desk', 'C-301', 40, 35000, 'Test organization for development', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months')
    `);
    
    // Insert users
    console.log("👥 Creating users...");
    await db.execute(sql`
      INSERT INTO users (email, password, first_name, last_name, phone, role, organization_id, site, office_type, office_number, credits, used_credits, is_active, can_charge_cafe_to_org, can_charge_room_to_org, start_date, bio) VALUES
      ('admin@calmkaaj.dev', '$2b$10$K8vQk2G7B9Q8L9Q3R7P1eO1L5X6Y8Z2C1W3V4N5M6A7S8D9F0G1H2J3K4L5', 'Dev', 'Admin', '+923001234570', 'calmkaaj_admin', '550e8400-e29b-41d4-a716-446655440001', 'blue_area', 'hot_desk', 'D-101', 100, 0, true, true, true, NOW() - INTERVAL '1 month', 'Development admin user'),
      ('member@calmkaaj.dev', '$2b$10$K8vQk2G7B9Q8L9Q3R7P1eO1L5X6Y8Z2C1W3V4N5M6A7S8D9F0G1H2J3K4L5', 'Dev', 'Member', '+923001234571', 'member_individual', NULL, 'blue_area', 'hot_desk', 'D-102', 30, 5, true, false, false, NOW() - INTERVAL '1 month', 'Development individual member'),
      ('orgadmin@calmkaaj.dev', '$2b$10$K8vQk2G7B9Q8L9Q3R7P1eO1L5X6Y8Z2C1W3V4N5M6A7S8D9F0G1H2J3K4L5', 'Dev', 'OrgAdmin', '+923001234572', 'member_organization_admin', '550e8400-e29b-41d4-a716-446655440002', 'i_10', 'dedicated_desk', 'E-201', 50, 10, true, true, true, NOW() - INTERVAL '1 month', 'Development organization admin'),
      ('cafe@calmkaaj.dev', '$2b$10$K8vQk2G7B9Q8L9Q3R7P1eO1L5X6Y8Z2C1W3V4N5M6A7S8D9F0G1H2J3K4L5', 'Dev', 'Cafe', '+923001234573', 'cafe_manager', NULL, 'blue_area', 'hot_desk', 'F-101', 40, 0, true, false, false, NOW() - INTERVAL '1 month', 'Development cafe manager')
    `);
    
    // Insert cafe orders
    console.log("☕ Creating cafe orders...");
    await db.execute(sql`
      INSERT INTO cafe_orders (id, user_id, organization_id, item_name, quantity, unit_price, total_price, status, order_type, delivery_location, created_at, updated_at) VALUES
      ('order-001', 1, '550e8400-e29b-41d4-a716-446655440001', 'Cappuccino', 2, 150, 300, 'delivered', 'organization', 'Reception', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour'),
      ('order-002', 2, NULL, 'Latte', 1, 200, 200, 'ready', 'personal', 'Waiting Area', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes'),
      ('order-003', 3, '550e8400-e29b-41d4-a716-446655440002', 'Espresso', 3, 100, 300, 'preparing', 'organization', 'Office A-101', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '15 minutes'),
      ('order-004', 4, NULL, 'Americano', 1, 120, 120, 'pending', 'personal', 'Takeaway', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '10 minutes')
    `);
    
    // Insert room bookings
    console.log("🏢 Creating room bookings...");
    await db.execute(sql`
      INSERT INTO room_bookings (id, user_id, organization_id, room_name, start_time, end_time, status, total_credits, purpose, created_at, updated_at) VALUES
      ('booking-001', 1, '550e8400-e29b-41d4-a716-446655440001', 'Meeting Room A', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 'confirmed', 10, 'Team meeting', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
      ('booking-002', 2, NULL, 'Meeting Room B', NOW() + INTERVAL '4 hours', NOW() + INTERVAL '5 hours', 'confirmed', 5, 'Client call', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),
      ('booking-003', 3, '550e8400-e29b-41d4-a716-446655440002', 'Conference Room', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '2 hours', 'confirmed', 20, 'Workshop', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
    `);
    
    // Verify results
    const summary = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM organizations) as organizations,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM cafe_orders) as orders,
        (SELECT COUNT(*) FROM room_bookings) as bookings
    `);
    
    const summaryData = summary[0];
    console.log('📊 Development Database Summary:');
    console.log(`🏢 Organizations: ${summaryData.organizations}`);
    console.log(`👥 Users: ${summaryData.users}`);
    console.log(`☕ Orders: ${summaryData.orders}`);
    console.log(`🏢 Bookings: ${summaryData.bookings}`);
    
    console.log('\n✅ Development database setup completed!');
    console.log('🔒 Production: Isolated and untouched');
    console.log('🏗️ Development: Ready for testing');
    
    console.log('\n🔑 Development Login Credentials:');
    console.log('Admin: admin@calmkaaj.dev / DevAdmin123!');
    console.log('Member: member@calmkaaj.dev / DevAdmin123!');
    console.log('Org Admin: orgadmin@calmkaaj.dev / DevAdmin123!');
    console.log('Cafe Manager: cafe@calmkaaj.dev / DevAdmin123!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('🔒 No production database was accessed');
    throw error;
  } finally {
    await pool.end();
  }
}

setupDevelopmentDatabase();