#!/bin/bash

echo "🚀 GitHub Actions Deployment Setup"
echo "===================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo ""
    echo "📦 Install it with:"
    echo "   brew install gh"
    echo ""
    read -p "Would you like to install it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        brew install gh
    else
        echo "Please install GitHub CLI and run this script again"
        exit 1
    fi
fi

echo "✅ GitHub CLI installed"
echo ""

# Check if logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo "🔐 Not logged in to GitHub"
    echo "Logging in..."
    gh auth login
fi

echo "✅ Authenticated with GitHub"
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local secret_value=$3
    
    if [ -z "$secret_value" ]; then
        echo "📝 $secret_description"
        read -s -p "Enter value for $secret_name: " secret_value
        echo ""
    fi
    
    if [ -n "$secret_value" ]; then
        gh secret set "$secret_name" --body "$secret_value"
        echo "✅ Set $secret_name"
    else
        echo "⚠️  Skipped $secret_name (no value provided)"
    fi
    echo ""
}

echo "📋 Setting up GitHub Secrets"
echo "=============================="
echo ""

# Generate SESSION_SECRET if needed
echo "1️⃣ SESSION_SECRET (for session encryption)"
read -p "Generate random SESSION_SECRET? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    SESSION_SECRET=$(openssl rand -hex 32)
    set_secret "SESSION_SECRET" "Generated secure session secret" "$SESSION_SECRET"
else
    set_secret "SESSION_SECRET" "Session encryption key"
fi

# DATABASE_URL
echo "2️⃣ DATABASE_URL"
echo "Choose your database provider:"
echo "   a) Railway"
echo "   b) Neon"
echo "   c) Supabase"
echo "   d) Render"
echo "   e) Other/Skip"
echo ""
read -p "Select (a/b/c/d/e): " -n 1 -r DB_CHOICE
echo ""
echo ""

case $DB_CHOICE in
    a|A)
        echo "📝 Get your DATABASE_URL from Railway:"
        echo "   1. Go to railway.app"
        echo "   2. Select your project"
        echo "   3. Click on PostgreSQL service"
        echo "   4. Go to Variables tab"
        echo "   5. Copy DATABASE_URL value"
        echo ""
        set_secret "DATABASE_URL" "Railway PostgreSQL connection string"
        ;;
    b|B)
        echo "📝 Get your DATABASE_URL from Neon:"
        echo "   1. Go to console.neon.tech"
        echo "   2. Select your project"
        echo "   3. Click 'Connection Details'"
        echo "   4. Copy the connection string"
        echo ""
        set_secret "DATABASE_URL" "Neon PostgreSQL connection string"
        ;;
    c|C)
        echo "📝 Get your DATABASE_URL from Supabase:"
        echo "   1. Go to app.supabase.com"
        echo "   2. Select your project"
        echo "   3. Go to Project Settings > Database"
        echo "   4. Copy Connection string (URI)"
        echo ""
        set_secret "DATABASE_URL" "Supabase PostgreSQL connection string"
        ;;
    d|D)
        echo "📝 Get your DATABASE_URL from Render:"
        echo "   1. Go to dashboard.render.com"
        echo "   2. Select your PostgreSQL database"
        echo "   3. Copy 'Internal Database URL'"
        echo ""
        set_secret "DATABASE_URL" "Render PostgreSQL connection string"
        ;;
    *)
        echo "⚠️  Skipping DATABASE_URL - set it manually in GitHub settings"
        ;;
esac

# RESEND_API_KEY
echo "3️⃣ RESEND_API_KEY (for sending emails)"
echo "Get your API key from: https://resend.com/api-keys"
echo ""
set_secret "RESEND_API_KEY" "Resend API key for email service"

# Deployment platform tokens
echo "4️⃣ Deployment Platform Tokens"
echo "=============================="
echo ""

read -p "Are you deploying to Railway? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📝 Get your RAILWAY_TOKEN from:"
    echo "   1. Go to railway.app"
    echo "   2. Click on your profile (top right)"
    echo "   3. Go to 'Account Settings'"
    echo "   4. Go to 'Tokens' tab"
    echo "   5. Click 'Create Token'"
    echo ""
    set_secret "RAILWAY_TOKEN" "Railway deployment token"
fi
echo ""

read -p "Are you deploying to Render? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📝 Get your RENDER_DEPLOY_HOOK from:"
    echo "   1. Go to dashboard.render.com"
    echo "   2. Select your web service"
    echo "   3. Go to Settings"
    echo "   4. Scroll to 'Deploy Hook'"
    echo "   5. Click 'Create Deploy Hook'"
    echo "   6. Copy the URL"
    echo ""
    set_secret "RENDER_DEPLOY_HOOK" "Render deploy hook URL"
fi
echo ""

read -p "Are you deploying to Fly.io? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📝 Getting Fly.io API token..."
    if command -v flyctl &> /dev/null; then
        FLY_TOKEN=$(flyctl auth token 2>/dev/null)
        if [ -n "$FLY_TOKEN" ]; then
            set_secret "FLY_API_TOKEN" "Fly.io API token" "$FLY_TOKEN"
        else
            echo "⚠️  Could not get Fly.io token. Login with: flyctl auth login"
        fi
    else
        echo "⚠️  Fly.io CLI not installed. Install with: brew install flyctl"
    fi
fi

echo ""
echo "✅ GitHub Secrets Setup Complete!"
echo ""
echo "📋 Summary"
echo "=========="
echo ""
echo "View all secrets:"
gh secret list
echo ""

echo "🚀 Next Steps"
echo "============="
echo ""
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Configure GitHub Actions deployment'"
echo "   git push origin main"
echo ""
echo "2. Monitor deployment:"
echo "   GitHub Repo → Actions tab"
echo "   Or: gh run watch"
echo ""
echo "3. View deployment logs:"
echo "   gh run list"
echo "   gh run view <run-id>"
echo ""
echo "📚 Documentation"
echo "================"
echo "See GITHUB_ACTIONS_SETUP.md for detailed instructions"
echo ""
