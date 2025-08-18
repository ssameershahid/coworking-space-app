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
    
    // Check if columns already exist
    console.log("🔍 Checking existing columns...");
    const existingColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      AND column_name IN ('office_type', 'office_number', 'monthly_credits', 'monthly_fee', 'description')
    `);
    
    console.log("📋 Existing columns:", existingColumns);
    
    // Add missing columns
    console.log("🔧 Adding missing columns to organizations table...");
    await db.execute(sql`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS office_type TEXT DEFAULT 'private_office',
      ADD COLUMN IF NOT EXISTS office_number TEXT,
      ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT 30,
      ADD COLUMN IF NOT EXISTS monthly_fee INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    
    // Verify the migration
    console.log("✅ Verifying migration...");
    const finalColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      ORDER BY ordinal_position
    `);
    
    console.log("📊 Final table structure:");
    console.table(finalColumns);
    
    // Check organizations count
    const orgCount = await db.execute(sql`SELECT COUNT(*) as count FROM organizations`);
    console.log("📈 Organizations in database:", orgCount[0]?.count);
    
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
