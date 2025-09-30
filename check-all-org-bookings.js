import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function checkAllOrgBookings() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('\n🔍 CHECKING ALL ORGANIZATION-BILLED BOOKINGS:\n');
    console.log('═'.repeat(100));
    
    const bookingsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN billed_to = 'personal' THEN 1 END) as personal_count,
        COUNT(CASE WHEN billed_to = 'organization' THEN 1 END) as organization_count
      FROM meeting_bookings
    `);

    const stats = bookingsResult.rows[0];
    console.log(`\nTotal Bookings: ${stats.total_bookings}`);
    console.log(`  - Personal: ${stats.personal_count}`);
    console.log(`  - Organization: ${stats.organization_count}`);
    
    if (parseInt(stats.organization_count) === 0) {
      console.log(`\n🚨 **CRITICAL**: There are ZERO organization-billed bookings in the database!`);
      console.log(`   All ${stats.total_bookings} bookings are billed to personal.\n`);
    }

    console.log('\n═'.repeat(100));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAllOrgBookings();
