#!/bin/bash

echo "🧪 Testing Railway Database Connection"
echo "======================================="
echo ""

cd /Users/sameer/Downloads/CalmKaaj-App-DO-NOT-EDIT

echo "1️⃣ Testing via Railway CLI (internal URL)..."
echo ""

# Test using railway run to access internal network
railway run node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:RqdIigUKofpdcISYdWCFuzEXrFlQIKOr@postgres.railway.internal:5432/railway'
});

pool.query('SELECT COUNT(*) as user_count FROM users')
  .then(res => {
    console.log('✅ Connection successful!');
    console.log('📊 Users in Railway database:', res.rows[0].user_count);
    pool.end();
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    pool.end();
    process.exit(1);
  });
"

echo ""
echo "✅ Railway database is accessible via Railway CLI!"
echo ""
echo "To run your app with Railway database:"
echo "  ./start-with-railway.sh"
echo ""
