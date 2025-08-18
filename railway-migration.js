// Simple Railway Migration Script
// This will run directly in Railway's environment

import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { sql } from "drizzle-orm";

console.log("🚀 Starting Railway migration...");

// Get DATABASE_URL from Railway environment
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment");
  process.exit(1);
}

console.log("🔗 Database URL found:", DATABASE_URL.substring(0, 20) + "...");

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

const db = drizzle(pool);

async function runMigration() {
  try {
    console.log("🔍 Testing database connection...");
    await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Database connected");
    
    console.log("🔧 Adding missing columns to organizations table...");
    await db.execute(sql`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS office_type TEXT DEFAULT 'private_office',
      ADD COLUMN IF NOT EXISTS office_number TEXT,
      ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT 30,
      ADD COLUMN IF NOT EXISTS monthly_fee INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    
    console.log("✅ Migration completed!");
    
    // Verify
    const columns = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      ORDER BY ordinal_position
    `);
    console.log("📋 Table columns:", Array.isArray(columns) ? columns.map(c => c.column_name) : columns);
    
    const count = await db.execute(sql`SELECT COUNT(*) as count FROM organizations`);
    console.log("📈 Organizations count:", Array.isArray(count) && count.length > 0 ? count[0]?.count : count);
    
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
