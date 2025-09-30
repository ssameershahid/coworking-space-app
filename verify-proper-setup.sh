#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║     🔍 VERIFYING PROPER CONFIGURATION 🔍                      ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Checking Latest GitHub Commit..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
git log --oneline -1
LATEST_COMMIT=$(git log --format="%s" -1)
echo ""
if [[ "$LATEST_COMMIT" == *"conditional session config"* ]]; then
    echo "✅ Latest commit has the proper fix!"
else
    echo "⚠️  Latest commit: $LATEST_COMMIT"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Checking Railway Health Endpoint..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

HEALTH=$(curl -s https://app.calmkaaj.org/api/health)
echo "$HEALTH" | python3 -m json.tool

NODE_ENV=$(echo "$HEALTH" | python3 -c "import sys, json; print(json.load(sys.stdin)['config']['environment'])" 2>/dev/null)

echo ""
if [ "$NODE_ENV" = "development" ]; then
    echo "✅ PERFECT! Railway is using NODE_ENV=development"
    echo "   Session cookies will use: secure=false, sameSite=lax"
    echo "   This is the CORRECT configuration for development!"
elif [ "$NODE_ENV" = "production" ]; then
    echo "⚠️  WARNING: Railway is using NODE_ENV=production"
    echo ""
    echo "   This means session cookies will use: secure=true, sameSite=none"
    echo "   This REQUIRES proper HTTPS setup."
    echo ""
    echo "   If your app is for DEVELOPMENT, you should:"
    echo "   1. Go to Railway → Variables"
    echo "   2. Set: NODE_ENV = development"
    echo "   3. Redeploy"
else
    echo "❌ Could not determine NODE_ENV from health endpoint"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Testing Session Cookie Configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test login and check for Set-Cookie
LOGIN_RESPONSE=$(curl -s -i -X POST https://app.calmkaaj.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@calmkaaj.com","password":"admin1234"}' 2>&1)

if echo "$LOGIN_RESPONSE" | grep -q "Set-Cookie"; then
    echo "✅ Session cookies ARE being set!"
    echo ""
    echo "Cookie details:"
    echo "$LOGIN_RESPONSE" | grep "Set-Cookie" | sed 's/set-cookie: /  /i'
    
    # Check if secure flag is present
    if echo "$LOGIN_RESPONSE" | grep -i "Set-Cookie" | grep -q "Secure"; then
        echo ""
        echo "📋 Cookie has 'Secure' flag (requires HTTPS)"
        echo "   This is correct for NODE_ENV=production"
    else
        echo ""
        echo "📋 Cookie does NOT have 'Secure' flag"
        echo "   This is correct for NODE_ENV=development"
    fi
    
    # Check SameSite
    if echo "$LOGIN_RESPONSE" | grep -i "Set-Cookie" | grep -q "SameSite=None"; then
        echo "📋 Cookie has 'SameSite=None'"
        echo "   This is correct for NODE_ENV=production"
    elif echo "$LOGIN_RESPONSE" | grep -i "Set-Cookie" | grep -q "SameSite=Lax"; then
        echo "📋 Cookie has 'SameSite=Lax'"
        echo "   This is correct for NODE_ENV=development"
    fi
else
    echo "❌ Session cookies are NOT being set!"
    echo ""
    echo "This is a problem. Check Railway logs for errors."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$NODE_ENV" = "development" ] && echo "$LOGIN_RESPONSE" | grep -q "Set-Cookie"; then
    echo "✅ PERFECT SETUP!"
    echo ""
    echo "   - NODE_ENV is 'development'"
    echo "   - Session cookies are being set"
    echo "   - Using proper conditional configuration"
    echo ""
    echo "   Your app is properly configured! 🎉"
elif [ "$NODE_ENV" = "production" ] && echo "$LOGIN_RESPONSE" | grep -q "Set-Cookie"; then
    echo "✅ WORKING (Production Mode)"
    echo ""
    echo "   - NODE_ENV is 'production'"
    echo "   - Session cookies are being set with Secure flag"
    echo "   - This is correct for production HTTPS environment"
    echo ""
    echo "   If this is your DEVELOPMENT environment, consider changing"
    echo "   NODE_ENV to 'development' in Railway for better clarity."
else
    echo "⚠️  NEEDS ATTENTION"
    echo ""
    echo "   Check the details above and:"
    echo "   1. Verify Railway variables are set correctly"
    echo "   2. Make sure Railway deployed the latest code"
    echo "   3. Check Railway deployment logs for errors"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
