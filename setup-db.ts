import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import * as schema from "./shared/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql_client = neon(DATABASE_URL);
const db = drizzle(sql_client, { schema });

async function setupDatabase() {
  console.log("Setting up database...");
  
  try {
    // Create tables directly using SQL
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id text PRIMARY KEY,
        name text NOT NULL,
        email text NOT NULL,
        phone text,
        address text,
        site text NOT NULL DEFAULT 'blue_area',
        created_at timestamp DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        first_name text NOT NULL,
        last_name text NOT NULL,
        phone text,
        role text NOT NULL DEFAULT 'member_individual',
        organization_id text REFERENCES organizations(id),
        site text NOT NULL DEFAULT 'blue_area',
        credits integer DEFAULT 0,
        used_credits integer DEFAULT 0,
        is_active boolean DEFAULT true,
        can_charge_cafe_to_org boolean DEFAULT false,
        can_charge_room_to_org boolean DEFAULT false,
        created_at timestamp DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id serial PRIMARY KEY,
        name text NOT NULL,
        description text
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS menu_items (
        id serial PRIMARY KEY,
        name text NOT NULL,
        description text,
        price decimal(10,2) NOT NULL,
        category_id integer REFERENCES menu_categories(id),
        image_url text,
        is_available boolean DEFAULT true,
        is_daily_special boolean DEFAULT false,
        site text NOT NULL DEFAULT 'blue_area',
        created_at timestamp DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cafe_orders (
        id serial PRIMARY KEY,
        user_id integer NOT NULL REFERENCES users(id),
        total_amount decimal(10,2) NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        billed_to text NOT NULL DEFAULT 'personal',
        org_id text REFERENCES organizations(id),
        handled_by integer REFERENCES users(id),
        notes text,
        site text NOT NULL DEFAULT 'blue_area',
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cafe_order_items (
        id serial PRIMARY KEY,
        order_id integer NOT NULL REFERENCES cafe_orders(id),
        menu_item_id integer NOT NULL REFERENCES menu_items(id),
        quantity integer NOT NULL,
        price decimal(10,2) NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS meeting_rooms (
        id serial PRIMARY KEY,
        name text NOT NULL,
        description text,
        capacity integer NOT NULL,
        credit_cost_per_hour integer NOT NULL,
        amenities text[],
        image_url text,
        is_available boolean DEFAULT true,
        site text NOT NULL DEFAULT 'blue_area',
        created_at timestamp DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS meeting_bookings (
        id serial PRIMARY KEY,
        user_id integer NOT NULL REFERENCES users(id),
        room_id integer NOT NULL REFERENCES meeting_rooms(id),
        start_time timestamp NOT NULL,
        end_time timestamp NOT NULL,
        credits_used integer NOT NULL,
        status text NOT NULL DEFAULT 'confirmed',
        billed_to text NOT NULL DEFAULT 'personal',
        org_id text REFERENCES organizations(id),
        notes text,
        site text NOT NULL DEFAULT 'blue_area',
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS announcements (
        id serial PRIMARY KEY,
        title text NOT NULL,
        body text NOT NULL,
        image_url text,
        show_until timestamp,
        is_active boolean DEFAULT true,
        site text NOT NULL DEFAULT 'blue_area',
        created_at timestamp DEFAULT now()
      );
    `);

    console.log("Database setup completed successfully!");
    
    // Insert some initial data
    await seedDatabase();
    
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

async function seedDatabase() {
  console.log("Seeding database with initial data...");
  
  try {
    // Insert sample organizations
    await db.execute(sql`
      INSERT INTO organizations (name, email, site) 
      VALUES 
        ('Tech Innovations Inc', 'admin@techinnovations.com', 'blue_area'),
        ('Marketing Solutions LLC', 'contact@marketingsolutions.com', 'i_10')
      ON CONFLICT DO NOTHING;
    `);

    // Insert sample users (password is 'password123' hashed with bcrypt)
    await db.execute(sql`
      INSERT INTO users (email, password, first_name, last_name, role, site, credits) 
      VALUES 
        ('admin@calmkaaj.com', '$2b$10$rZJhyNJLt6DcQxjwwgXFBeTOoQCuZKBcD/V4cXbqN.vDC3YVEaLbO', 'Admin', 'User', 'enterprise_administrator', 'blue_area', 100),
        ('manager@calmkaaj.com', '$2b$10$rZJhyNJLt6DcQxjwwgXFBeTOoQCuZKBcD/V4cXbqN.vDC3YVEaLbO', 'Cafe', 'Manager', 'cafe_manager', 'blue_area', 50),
        ('member@example.com', '$2b$10$rZJhyNJLt6DcQxjwwgXFBeTOoQCuZKBcD/V4cXbqN.vDC3YVEaLbO', 'John', 'Doe', 'member_individual', 'blue_area', 75)
      ON CONFLICT (email) DO NOTHING;
    `);

    // Insert menu categories
    await db.execute(sql`
      INSERT INTO menu_categories (name, description) 
      VALUES 
        ('Beverages', 'Hot and cold drinks'),
        ('Snacks', 'Light bites and snacks'),
        ('Meals', 'Full meals and lunch items')
      ON CONFLICT DO NOTHING;
    `);

    // Insert sample menu items
    await db.execute(sql`
      INSERT INTO menu_items (name, description, price, category_id, site, is_available) 
      VALUES 
        ('Cappuccino', 'Freshly brewed cappuccino', 4.50, 1, 'blue_area', true),
        ('Green Tea', 'Organic green tea', 3.00, 1, 'blue_area', true),
        ('Chicken Sandwich', 'Grilled chicken sandwich with fresh vegetables', 8.50, 3, 'blue_area', true),
        ('Fruit Salad', 'Fresh seasonal fruit salad', 6.00, 2, 'blue_area', true),
        ('Espresso', 'Double shot espresso', 3.50, 1, 'i_10', true)
      ON CONFLICT DO NOTHING;
    `);

    // Insert sample meeting rooms
    await db.execute(sql`
      INSERT INTO meeting_rooms (name, description, capacity, credit_cost_per_hour, amenities, site) 
      VALUES 
        ('Conference Room A', 'Large conference room with projector', 12, 5, ARRAY['Projector', 'Whiteboard', 'WiFi'], 'blue_area'),
        ('Meeting Room B', 'Small meeting room for team discussions', 6, 3, ARRAY['Whiteboard', 'WiFi'], 'blue_area'),
        ('Executive Suite', 'Premium meeting space', 8, 8, ARRAY['Projector', 'Whiteboard', 'WiFi', 'Coffee Machine'], 'i_10')
      ON CONFLICT DO NOTHING;
    `);

    // Insert sample announcements
    await db.execute(sql`
      INSERT INTO announcements (title, body, site, is_active) 
      VALUES 
        ('Welcome to CalmKaaj', 'Welcome to your new coworking space! Enjoy our facilities and services.', 'blue_area', true),
        ('New Menu Items', 'Check out our new healthy lunch options available now in the café.', 'blue_area', true)
      ON CONFLICT DO NOTHING;
    `);

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

setupDatabase();