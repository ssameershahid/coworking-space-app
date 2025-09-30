import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function checkRooms() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('\n🔍 CHECKING ALL MEETING ROOMS:\n');
    console.log('═'.repeat(80));
    
    const roomsResult = await pool.query(`
      SELECT 
        id, 
        name, 
        capacity, 
        credit_cost_per_hour, 
        is_available, 
        site
      FROM meeting_rooms
      ORDER BY id
    `);

    console.log(`\nTotal Rooms: ${roomsResult.rows.length}\n`);
    
    roomsResult.rows.forEach(room => {
      console.log(`Room ID: ${room.id}`);
      console.log(`  Name: ${room.name}`);
      console.log(`  Capacity: ${room.capacity}`);
      console.log(`  Credit Cost/Hour: ${room.credit_cost_per_hour} 💰`);
      console.log(`  Available: ${room.is_available}`);
      console.log(`  Site: ${room.site}`);
      
      if (room.credit_cost_per_hour === 0) {
        console.log(`  ⚠️  WARNING: THIS ROOM HAS 0 CREDIT COST!`);
      }
      console.log('');
    });

    console.log('═'.repeat(80));
    console.log('\n🔍 CHECKING RECENT ORGANIZATION BOOKINGS:\n');
    console.log('═'.repeat(80));

    const bookingsResult = await pool.query(`
      SELECT 
        mb.id,
        mb.credits_used,
        mb.billed_to,
        mb.created_at,
        mr.name as room_name,
        mr.credit_cost_per_hour,
        u.first_name,
        u.last_name,
        o.name as org_name
      FROM meeting_bookings mb
      LEFT JOIN meeting_rooms mr ON mb.room_id = mr.id
      LEFT JOIN users u ON mb.user_id = u.id
      LEFT JOIN organizations o ON mb.org_id = o.id
      WHERE mb.billed_to = 'organization'
      ORDER BY mb.created_at DESC
      LIMIT 10
    `);

    console.log(`\nRecent Organization Bookings: ${bookingsResult.rows.length}\n`);
    
    bookingsResult.rows.forEach(booking => {
      console.log(`Booking ID: ${booking.id}`);
      console.log(`  User: ${booking.first_name} ${booking.last_name}`);
      console.log(`  Organization: ${booking.org_name}`);
      console.log(`  Room: ${booking.room_name} (Cost/Hr: ${booking.credit_cost_per_hour})`);
      console.log(`  Credits Used: ${booking.credits_used} 💳`);
      console.log(`  Billed To: ${booking.billed_to}`);
      console.log(`  Created: ${booking.created_at}`);
      
      if (parseFloat(booking.credits_used) === 0) {
        console.log(`  ⚠️  WARNING: THIS BOOKING USED 0 CREDITS!`);
      }
      console.log('');
    });

    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkRooms();
