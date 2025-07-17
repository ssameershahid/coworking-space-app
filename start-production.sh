#!/bin/bash

# Production startup script for CalmKaaj
# This eliminates tsx overhead by running the compiled production build

echo "Starting CalmKaaj in production mode..."

# Kill any existing development processes
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "node.*tsx" 2>/dev/null || true

# Wait for cleanup
sleep 2

# Start production server
echo "Starting production server..."
NODE_ENV=production node dist/index.js

echo "Production server started successfully!"