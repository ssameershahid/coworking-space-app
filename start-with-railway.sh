#!/bin/bash

echo "🚂 Starting CalmKaaj with Railway Database Connection"
echo "====================================================="
echo ""
echo "This will run your app with access to Railway's internal network"
echo "So it can connect to: postgres.railway.internal"
echo ""

cd /Users/sameer/Downloads/CalmKaaj-App-DO-NOT-EDIT

# Make sure we're linked to the right project
echo "📋 Railway Project: calmkaaj"
railway status
echo ""

echo "🔗 Starting development server with Railway network access..."
echo ""
echo "Your app will be available at: http://localhost:5000"
echo "Database: Railway PostgreSQL (via internal network)"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run the dev server with Railway environment
railway run npm run dev
