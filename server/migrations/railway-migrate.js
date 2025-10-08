// Railway Database Migration Script
// This script adds missing columns to the organizations table

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

async function runMigration() {
  try {
    console.log("🔧 Starting Railway database migration...");
    
    // Check if columns already exist in organizations
    console.log("🔍 Checking existing columns in organizations...");
    const existingOrgColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      AND column_name IN ('office_type', 'office_number', 'monthly_credits', 'monthly_fee', 'description')
    `);
    
    console.log("📋 Existing organization columns:", existingOrgColumns);
    
    // Add missing columns to organizations
    console.log("🔧 Adding missing columns to organizations table...");
    await db.execute(sql`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS office_type TEXT DEFAULT 'private_office',
      ADD COLUMN IF NOT EXISTS office_number TEXT,
      ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT 30,
      ADD COLUMN IF NOT EXISTS monthly_fee INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    
    // Check if columns already exist in users
    console.log("🔍 Checking existing columns in users...");
    const existingUserColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('office_type', 'office_number')
    `);
    
    console.log("📋 Existing user columns:", existingUserColumns);
    
    // Add missing columns to users
    console.log("🔧 Adding missing columns to users table...");
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS office_type TEXT DEFAULT 'hot_desk',
      ADD COLUMN IF NOT EXISTS office_number TEXT;
    `);
    
    // Verify the organizations migration
    console.log("✅ Verifying organizations migration...");
    const finalOrgColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      ORDER BY ordinal_position
    `);
    
    console.log("📊 Final organizations table structure:");
    console.table(finalOrgColumns);
    
    // Verify the users migration
    console.log("✅ Verifying users migration...");
    const finalUserColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('office_type', 'office_number')
    `);
    
    console.log("📊 Users office fields:");
    console.table(finalUserColumns);
    
    // Check organizations count
    const orgCount = await db.execute(sql`SELECT COUNT(*) as count FROM organizations`);
    console.log("📈 Organizations in database:", orgCount[0]?.count);
    
    // Check users count
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    console.log("📈 Users in database:", userCount[0]?.count);
    
    console.log("✅ Migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error);
