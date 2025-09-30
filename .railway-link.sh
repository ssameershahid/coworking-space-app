#!/bin/bash
# Script to link Railway and set environment variables

echo "Setting Railway environment variables..."

# Try to set variables using environment variables to bypass interactive prompts
export RAILWAY_PROJECT_ID="calmkaaj"
export RAILWAY_ENVIRONMENT="development"

echo "Setting DATABASE_URL..."
railway variables --set "DATABASE_URL=postgresql://postgres:RqdIigUKofpdcISYdWCFuzEXrFlQIKOr@metro.proxy.rlwy.net:59467/railway"

echo "Setting SESSION_SECRET..."
railway variables --set "SESSION_SECRET=3fe8b8d7b811ec9c56c97120942a7d32c7cdb603fa9ecb94a70e120f0dbea44a"

echo "Setting NODE_ENV..."
railway variables --set "NODE_ENV=development"

echo "Done! Check Railway dashboard to verify."
