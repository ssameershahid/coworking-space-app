// Force Database Migration Script
// Run this to manually add missing columns to organizations table

import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { sql } from "drizzle-orm";

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  console.log("🔗 Using DATABASE_URL:", url.substring(0, 20) + "...");
  return url;
};

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 1,
});

const db = drizzle(pool);

async function forceMigration() {
  try {
    console.log("🚀 FORCE MIGRATION: Starting...");
    
    // Test connection
    console.log("🔍 Testing database connection...");
    await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Database connection successful");
    
    // Check table exists
    console.log("🔍 Checking organizations table...");
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations'
      ) as exists
    `);
    
    if (!tableExists || !Array.isArray(tableExists) || !tableExists[0]?.exists) {
      console.error("❌ Organizations table does not exist!");
      return;
    }
    console.log("✅ Organizations table exists");
    
    // Check current columns
    console.log("🔍 Checking current columns...");
    const currentColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      ORDER BY ordinal_position
    `);
    console.log("📋 Current columns:", currentColumns);
    
    // Add missing columns
    console.log("🔧 Adding missing columns...");
    const migrationResult = await db.execute(sql`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS office_type TEXT DEFAULT 'private_office',
      ADD COLUMN IF NOT EXISTS office_number TEXT,
      ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT 30,
      ADD COLUMN IF NOT EXISTS monthly_fee INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    console.log("🔧 Migration executed:", migrationResult);
    
    // Verify new columns
    console.log("✅ Verifying new columns...");
    const finalColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      ORDER BY ordinal_position
    `);
    console.log("📊 Final columns:", finalColumns);
    
    // Check organizations
    const orgCount = await db.execute(sql`SELECT COUNT(*) as count FROM organizations`);
    console.log("📈 Organizations count:", orgCount[0]?.count);
    
    console.log("✅ FORCE MIGRATION COMPLETED SUCCESSFULLY!");
    
  } catch (error) {
    console.error("❌ FORCE MIGRATION FAILED:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  } finally {
    await pool.end();
    console.log("🔌 Database connection closed");
  }
}

// Run the migration
forceMigration();
