#!/bin/bash

# Production startup script for CalmKaaj
# This ensures the app always runs in production mode

echo "🚀 Starting CalmKaaj in PRODUCTION mode..."

# Kill any existing development servers
pkill -f "tsx server/index.ts" || true

# Build the application if dist doesn't exist or is outdated
if [ ! -f "dist/index.js" ] || [ "server/index.ts" -nt "dist/index.js" ]; then
  echo "📦 Building application..."
  npm run build
fi

# Start production server
echo "🏃 Starting production server..."
NODE_ENV=production exec node dist/index.js