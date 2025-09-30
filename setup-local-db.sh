#!/bin/bash

echo "🔧 CalmKaaj Local Database Setup (Without Docker)"
echo "=================================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed"
    echo ""
    echo "📦 Installing PostgreSQL via Homebrew..."
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew is not installed. Please install it first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    brew install postgresql@16
    echo "✅ PostgreSQL installed"
fi

echo "1️⃣ Starting PostgreSQL service..."
brew services start postgresql@16 2>/dev/null || brew services start postgresql
sleep 3
echo "   ✅ PostgreSQL service started"

echo ""
echo "2️⃣ Creating database..."
# Drop database if it exists and create new one
dropdb calmkaaj_db 2>/dev/null || true
createdb calmkaaj_db
echo "   ✅ Database 'calmkaaj_db' created"

echo ""
echo "3️⃣ Restoring data from backup..."
if [ -f "calmkaaj_full_backup.sql" ]; then
    psql calmkaaj_db < calmkaaj_full_backup.sql
    echo "   ✅ Data restored successfully"
else
    echo "   ⚠️  Backup file not found!"
    echo "   Looking for: calmkaaj_full_backup.sql"
    exit 1
fi

echo ""
echo "4️⃣ Updating .env file..."
# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "   ✅ Created backup of .env"

# Update DATABASE_URL for local PostgreSQL
# Get the current user
CURRENT_USER=$(whoami)
NEW_DB_URL="DATABASE_URL=postgresql://$CURRENT_USER@localhost:5432/calmkaaj_db"

# Replace DATABASE_URL line
sed -i.bak "s|^DATABASE_URL=.*|$NEW_DB_URL|" .env
echo "   ✅ Updated DATABASE_URL to: $NEW_DB_URL"

echo ""
echo "5️⃣ Verifying database connection and data..."
export $(cat .env | xargs)
node diagnose-db.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start your app: npm run dev"
echo "   2. Open http://localhost:5000 in your browser"
echo "   3. Log in with your admin credentials"
echo "   4. Your data should now be visible!"
echo ""
echo "🛠️  Database Management Commands:"
echo "   - Access database:  psql calmkaaj_db"
echo "   - Stop PostgreSQL:  brew services stop postgresql@16"
echo "   - Start PostgreSQL: brew services start postgresql@16"
echo ""
