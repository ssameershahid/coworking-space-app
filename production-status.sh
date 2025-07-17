#!/bin/bash
echo "🔍 PRODUCTION SERVER STATUS CHECK"
echo "=================================="

# Check if production build exists
if [ -f "dist/index.js" ]; then
    echo "✅ Production bundle exists ($(ls -lh dist/index.js | awk '{print $5}')"
else
    echo "❌ Production bundle missing - running build..."
    npm run build
fi

# Check if production server can start
echo "🚀 Testing production server startup..."
NODE_ENV=production timeout 5 node dist/index.js 2>&1 | head -5

echo ""
echo "📊 Current processes:"
ps aux | grep -E "(tsx|node)" | grep -v grep | head -10

echo ""
echo "🎯 Production vs Development comparison:"
echo "Development: tsx server/index.ts (high CPU/memory)"
echo "Production: node dist/index.js (low CPU/memory)"