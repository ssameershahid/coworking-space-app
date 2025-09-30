import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function checkAllBookings() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('\n🔍 CHECKING ALL MEETING BOOKINGS:\n');
    console.log('═'.repeat(100));
    
    const bookingsResult = await pool.query(`
      SELECT 
        mb.id,
        mb.credits_used,
        mb.billed_to,
        mb.org_id,
        mb.status,
        mb.created_at,
        mr.name as room_name,
        mr.credit_cost_per_hour,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        o.name as org_name
      FROM meeting_bookings mb
      LEFT JOIN meeting_rooms mr ON mb.room_id = mr.id
      LEFT JOIN users u ON mb.user_id = u.id
      LEFT JOIN organizations o ON mb.org_id = o.id
      ORDER BY mb.created_at DESC
      LIMIT 30
    `);

    console.log(`\nTotal Recent Bookings: ${bookingsResult.rows.length}\n`);
    
    if (bookingsResult.rows.length === 0) {
      console.log('⚠️  NO BOOKINGS FOUND IN DATABASE!\n');
    } else {
      bookingsResult.rows.forEach(booking => {
        console.log(`─`.repeat(100));
        console.log(`Booking ID: ${booking.id} | Status: ${booking.status}`);
        console.log(`  User: ${booking.first_name} ${booking.last_name} (${booking.email})`);
        console.log(`  User Role: ${booking.role}`);
        console.log(`  Room: ${booking.room_name} (Cost/Hr: ${booking.credit_cost_per_hour})`);
        console.log(`  Credits Used: ${booking.credits_used} 💳`);
        console.log(`  Billed To: ${booking.billed_to} ${booking.billed_to === 'organization' ? '🏢' : '👤'}`);
        console.log(`  Org ID: ${booking.org_id || 'null'}`);
        console.log(`  Organization: ${booking.org_name || 'N/A'}`);
        console.log(`  Created: ${booking.created_at}`);
        
        // Highlight issues
        if (parseFloat(booking.credits_used) === 0) {
          console.log(`  🚨 ISSUE: THIS BOOKING USED 0 CREDITS!`);
        }
        if (booking.billed_to === 'organization' && !booking.org_id) {
          console.log(`  🚨 ISSUE: Billed to organization but org_id is null!`);
        }
        if (booking.billed_to === 'personal' && booking.org_id) {
          console.log(`  ⚠️  WARNING: Billed to personal but has org_id ${booking.org_id}`);
        }
        console.log('');
      });
    }

    console.log('═'.repeat(100));
    console.log('\n📊 STATISTICS:\n');
    
    const statsResult = await pool.query(`
      SELECT 
        billed_to,
        COUNT(*) as count,
        SUM(credits_used::numeric) as total_credits
      FROM meeting_bookings
      GROUP BY billed_to
    `);

    console.log('Breakdown by Billing Type:');
    statsResult.rows.forEach(stat => {
      console.log(`  ${stat.billed_to}: ${stat.count} bookings, ${stat.total_credits || 0} credits`);
    });

    console.log('\n═'.repeat(100));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAllBookings();
