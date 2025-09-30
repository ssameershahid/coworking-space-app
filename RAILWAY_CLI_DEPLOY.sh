#!/bin/bash

# Emergency Railway CLI deployment script
# This bypasses GitHub and deploys directly from local code

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 EMERGENCY: Deploying to Railway via CLI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will deploy your LOCAL code directly to Railway,"
echo "bypassing GitHub entirely."
echo ""
echo "Press ENTER to continue, or Ctrl+C to cancel..."
read

echo ""
echo "Step 1: Linking to Railway project..."
railway link <<EOF
1
1
1
EOF

echo ""
echo "Step 2: Switching to development environment..."
railway environment development

echo ""
echo "Step 3: Deploying..."
railway up --environment development

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment initiated!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Wait 3-5 minutes, then check:"
echo "1. https://app.calmkaaj.org/api/health"
echo "2. Should show 'environment': 'development'"
echo "3. Try logging in!"
echo ""
