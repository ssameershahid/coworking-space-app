import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function checkOrgUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('\n🔍 CHECKING ORGANIZATION MEMBERS & PERMISSIONS:\n');
    console.log('═'.repeat(120));
    
    const usersResult = await pool.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.organization_id,
        u.can_charge_cafe_to_org,
        u.can_charge_room_to_org,
        u.credits,
        u.used_credits,
        o.name as org_name,
        o.monthly_credits
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.role IN ('member_organization', 'member_organization_admin')
      ORDER BY u.organization_id, u.id
    `);

    console.log(`\nTotal Organization Members: ${usersResult.rows.length}\n`);
    
    if (usersResult.rows.length === 0) {
      console.log('⚠️  NO ORGANIZATION MEMBERS FOUND!\n');
    } else {
      let currentOrg = null;
      usersResult.rows.forEach(user => {
        if (user.organization_id !== currentOrg) {
          console.log('─'.repeat(120));
          console.log(`\n📊 ORGANIZATION: ${user.org_name || 'Unknown'} (${user.organization_id})`);
          console.log(`   Monthly Credits: ${user.monthly_credits || 0}\n`);
          currentOrg = user.organization_id;
        }

        console.log(`   User ID: ${user.id} | ${user.first_name} ${user.last_name} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Organization ID: ${user.organization_id || 'null'}`);
        console.log(`   Permissions:`);
        console.log(`      - Can Charge Cafe to Org: ${user.can_charge_cafe_to_org ? '✅ YES' : '❌ NO'}`);
        console.log(`      - Can Charge Room to Org: ${user.can_charge_room_to_org ? '✅ YES' : '❌ NO'}`);
        console.log(`   Credits:`);
        console.log(`      - Total: ${user.credits || 0}`);
        console.log(`      - Used: ${user.used_credits || 0}`);
        console.log(`      - Available: ${(user.credits || 0) - parseFloat(user.used_credits || 0)}`);
        
        // Highlight issues
        if (!user.organization_id) {
          console.log(`   🚨 ISSUE: Has organization role but no organization_id!`);
        }
        if (user.role === 'member_organization' && !user.can_charge_room_to_org) {
          console.log(`   ⚠️  WARNING: Organization member cannot charge rooms to org!`);
        }
        console.log('');
      });
    }

    console.log('═'.repeat(120));
    console.log('\n📊 SUMMARY:\n');
    
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN can_charge_cafe_to_org = true THEN 1 END) as can_charge_cafe,
        COUNT(CASE WHEN can_charge_room_to_org = true THEN 1 END) as can_charge_room,
        COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as missing_org_id
      FROM users
      WHERE role IN ('member_organization', 'member_organization_admin')
    `);

    const summary = summaryResult.rows[0];
    console.log(`Total Organization Members: ${summary.total_members}`);
    console.log(`Can Charge Cafe to Org: ${summary.can_charge_cafe} / ${summary.total_members}`);
    console.log(`Can Charge Room to Org: ${summary.can_charge_room} / ${summary.total_members}`);
    console.log(`Missing Organization ID: ${summary.missing_org_id} / ${summary.total_members}`);
    
    if (parseInt(summary.missing_org_id) > 0) {
      console.log(`\n🚨 ${summary.missing_org_id} organization members are missing organization_id!`);
    }
    if (parseInt(summary.can_charge_room) < parseInt(summary.total_members)) {
      console.log(`\n⚠️  ${parseInt(summary.total_members) - parseInt(summary.can_charge_room)} organization members cannot charge rooms to org!`);
    }

    console.log('\n═'.repeat(120));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkOrgUsers();
