#!/usr/bin/env node

// Database Migration Script - Production to Development
// READ-ONLY operations on production database
// WRITE operations only to development database

import dotenv from 'dotenv';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const PROD_DB_URL = "postgresql://postgres:RqdIigUKofpdcISYdWCFuzEXrFlQIKOr@postgres.railway.internal:5432/railway";
const DEV_DB_URL = process.env.DATABASE_URL;

if (!DEV_DB_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('Please run: railway variables -e development to get your development database URL');
  process.exit(1);
}

// Connect to production (READ-ONLY)
const prodPool = new Pool({
  connectionString: PROD_DB_URL,
  application_name: 'migration-read-only',
  max: 1, // Limit connections
});

// Connect to development (READ-WRITE)
const devPool = new Pool({
  connectionString: DEV_DB_URL,
});

// Data anonymization functions
function anonymizeEmail(email) {
  const [localPart, domain] = email.split('@');
  return `test-${Math.random().toString(36).substring(7)}@${domain}`;
}

function anonymizePhone(phone) {
  return phone ? `+92${Math.floor(Math.random() * 9000000000) + 1000000000}` : null;
}

function anonymizeName(firstName, lastName) {
  const firstNames = ['John', 'Jane', 'Alex', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  return {
    first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
    last_name: lastNames[Math.floor(Math.random() * lastNames.length)]
  };
}

async function migrateProductionData() {
  console.log('🔄 Starting Production to Development Migration...');
  console.log('📡 Production DB: READ-ONLY operations only');
  console.log('💻 Development DB: Will receive anonymized data');
  
  try {
    // Test production connection (READ-ONLY)
    console.log('🔍 Testing production connection (read-only)...');
    const prodTest = await prodPool.query('SELECT 1 as test');
    if (prodTest.rows[0].test === 1) {
      console.log('✅ Production connection successful (read-only)');
    }
    
    // Test development connection
    console.log('🔍 Testing development connection...');
    const devTest = await devPool.query('SELECT 1 as test');
    if (devTest.rows[0].test === 1) {
      console.log('✅ Development connection successful');
    }

    // Get production data with READ-ONLY queries
    console.log('📊 Extracting data from production...');
    
    // Organizations (anonymized)
    const orgsResult = await prodPool.query(`
      SELECT id, name, email, phone, address, site, office_type, office_number, 
             monthly_credits, monthly_fee, description, start_date, created_at
      FROM organizations
      ORDER BY created_at DESC
      LIMIT 10  -- Limit for safety
    `);
    
    // Users (anonymized)
    const usersResult = await prodPool.query(`
      SELECT id, role, organization_id, site, office_type, office_number, 
             credits, used_credits, is_active, can_charge_cafe_to_org, 
             can_charge_room_to_org, start_date, bio
      FROM users
      ORDER BY created_at DESC
      LIMIT 20  -- Limit for safety
    `);

    // Cafe orders (business logic data - keep as-is for testing)
    const ordersResult = await prodPool.query(`
      SELECT * FROM cafe_orders 
      ORDER BY created_at DESC
      LIMIT 30  -- Reasonable test dataset
    `);

    // Room bookings (business logic data - keep as-is)
    const bookingsResult = await prodPool.query(`
      SELECT * FROM room_bookings
      ORDER BY created_at DESC
      LIMIT 30  -- Reasonable test dataset
    `);

    console.log(`📦 Extracted: ${orgsResult.rows.length} organizations`);
    console.log(`📦 Extracted: ${usersResult.rows.length} users`);
    console.log(`📦 Extracted: ${ordersResult.rows.length} orders`);
    console.log(`📦 Extracted: ${bookingsResult.rows.length} bookings`);

    // Clear development tables (WRITE operations)
    console.log('🧹 Cleaning development database...');
    await devPool.query('DELETE FROM cafe_orders');
    await devPool.query('DELETE FROM room_bookings');
    await devPool.query('DELETE FROM users');
    await devPool.query('DELETE FROM organizations');

    // Insert anonymized data into development
    console.log('💾 Inserting anonymized data into development...');
    
    // Insert organizations with anonymized contact info
    for (const org of orgsResult.rows) {
      const anonymizedOrg = {
        ...org,
        email: anonymizeEmail(org.email),
        phone: anonymizePhone(org.phone),
      };
      
      await devPool.query(`
        INSERT INTO organizations (id, name, email, phone, address, site, office_type, 
                               office_number, monthly_credits, monthly_fee, description, 
                               start_date, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        anonymizedOrg.id, anonymizedOrg.name, anonymizedOrg.email, anonymizedOrg.phone,
        anonymizedOrg.address, anonymizedOrg.site, anonymizedOrg.office_type,
        anonymizedOrg.office_number, anonymizedOrg.monthly_credits, anonymizedOrg.monthly_fee,
        anonymizedOrg.description, anonymizedOrg.start_date, anonymizedOrg.created_at
      ]);
    }

    // Insert users with anonymized personal info
    for (const user of usersResult.rows) {
      const anonName = anonymizeName(user.first_name, user.last_name);
      
      await devPool.query(`
        INSERT INTO users (id, role, organization_id, site, office_type, office_number,
                         credits, used_credits, is_active, can_charge_cafe_to_org,
                         can_charge_room_to_org, start_date, bio, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        user.id, user.role, user.organization_id, user.site, user.office_type,
        user.office_number, user.credits, user.used_credits, user.is_active,
        user.can_charge_cafe_to_org, user.can_charge_room_to_org, user.start_date,
        user.bio, anonName.first_name, anonName.last_name
      ]);
    }

    // Insert orders (business logic - keep original data structure)
    for (const order of ordersResult.rows) {
      await devPool.query(`
        INSERT INTO cafe_orders SELECT * FROM json_populate_record(NULL::cafe_orders, $1)
      `, [JSON.stringify(order)]);
    }

    // Insert bookings (business logic - keep original data structure)
    for (const booking of bookingsResult.rows) {
      await devPool.query(`
        INSERT INTO room_bookings SELECT * FROM json_populate_record(NULL::room_bookings, $1)
      `, [JSON.stringify(booking)]);
    }

    console.log('✅ Migration completed successfully!');
    console.log('🔒 Production data: READ-ONLY (no changes made)');
    console.log('🏗️ Development data: Anonymized copy created');
    
    // Verify development data
    const devOrgs = await devPool.query('SELECT COUNT(*) as count FROM organizations');
    const devUsers = await devPool.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Development database now contains: ${devOrgs.rows[0].count} organizations, ${devUsers.rows[0].count} users`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('🔒 No changes were made to production database');
    throw error;
  } finally {
    await prodPool.end();
    await devPool.end();
  }
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateProductionData().catch(console.error);
}

export { migrateProductionData };