#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║        🔍 CHECKING RAILWAY DEPLOYMENT STATUS 🔍               ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Checking current health endpoint..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

HEALTH_RESPONSE=$(curl -s https://app.calmkaaj.org/api/health)
echo "$HEALTH_RESPONSE" | python3 -m json.tool

CURRENT_ENV=$(echo "$HEALTH_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['config']['environment'])" 2>/dev/null)

echo ""
if [ "$CURRENT_ENV" = "production" ]; then
    echo "❌ PROBLEM: Still shows 'production' - Railway didn't deploy!"
    echo ""
    echo "This means Railway is NOT deploying from GitHub!"
else
    echo "✅ Shows 'development' - Fix deployed successfully!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Checking latest GitHub commit..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

git log --oneline -1
LATEST_COMMIT=$(git log --format="%H" -1)
echo ""
echo "Latest commit: $LATEST_COMMIT"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Testing if session cookies work..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Try to login and check if cookie is set
LOGIN_RESPONSE=$(curl -s -i -X POST https://app.calmkaaj.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@calmkaaj.com","password":"admin1234"}')

if echo "$LOGIN_RESPONSE" | grep -q "Set-Cookie"; then
    echo "✅ Login endpoint is setting cookies!"
    echo ""
    echo "Cookie headers:"
    echo "$LOGIN_RESPONSE" | grep "Set-Cookie"
else
    echo "❌ Login endpoint is NOT setting cookies!"
    echo ""
    echo "Response:"
    echo "$LOGIN_RESPONSE" | head -20
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. DIAGNOSIS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$CURRENT_ENV" = "production" ]; then
    echo "🚨 ROOT CAUSE: Railway is NOT deploying from GitHub!"
    echo ""
    echo "SOLUTIONS (in order of likelihood):"
    echo ""
    echo "1. Check Railway Settings → Source"
    echo "   - Make sure it's connected to GitHub"
    echo "   - Repo: ssameershahid/coworking-space-app"
    echo "   - Branch: main"
    echo ""
    echo "2. Check Railway Settings → Build/Start Commands"
    echo "   - Make sure there's NO hardcoded NODE_ENV=production"
    echo ""
    echo "3. Try Railway CLI deploy:"
    echo "   cd /Users/sameer/Downloads/CalmKaaj-App-DO-NOT-EDIT"
    echo "   railway up"
    echo ""
    echo "4. Check Railway Deployment Logs for errors"
    echo ""
else
    echo "✅ Railway deployed the fix!"
    echo ""
    echo "If you're still seeing 401 errors:"
    echo "1. Clear browser cache completely"
    echo "2. Use Incognito mode"
    echo "3. Check browser console for new errors"
    echo "4. Try logging in again"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
