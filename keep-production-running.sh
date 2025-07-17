#!/bin/bash

# CalmKaaj Production Server Monitor
# This script ensures production server stays running and blocks development server

echo "🔥 PRODUCTION MODE ENFORCER - Starting..."

# Kill any existing development servers
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "esbuild" 2>/dev/null || true

# Build if needed
if [ ! -f "dist/index.js" ] || [ "server/index.ts" -nt "dist/index.js" ]; then
  echo "📦 Building production bundle..."
  npm run build
fi

# Function to start production server
start_production() {
  echo "🚀 Starting production server..."
  NODE_ENV=production node dist/index.js &
  PROD_PID=$!
  echo "✅ Production server started with PID: $PROD_PID"
}

# Function to monitor and restart if needed
monitor_production() {
  while true; do
    # Check if production server is still running
    if ! pgrep -f "node dist/index.js" > /dev/null; then
      echo "⚠️  Production server stopped, restarting..."
      start_production
    fi
    
    # Kill any development servers that try to start
    pkill -f "tsx server/index.ts" 2>/dev/null || true
    pkill -f "esbuild" 2>/dev/null || true
    
    sleep 5
  done
}

# Start production server
start_production

# Monitor and keep it running
monitor_production