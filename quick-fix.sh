#!/bin/bash

echo "🔧 CalmKaaj Database Quick Fix Script"
echo "======================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "1️⃣ Updating .env file..."
# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "   ✅ Created backup of .env"

# Update DATABASE_URL
if grep -q "yamanote.proxy.rlwy.net" .env; then
    sed -i.bak 's|DATABASE_URL=postgresql://.*|DATABASE_URL=postgresql://postgres:calmkaaj_secure_password_2025@localhost:5432/calmkaaj_db|' .env
    echo "   ✅ Updated DATABASE_URL to local PostgreSQL"
else
    echo "   ℹ️  DATABASE_URL already updated or different format"
fi

echo ""
echo "2️⃣ Stopping existing containers..."
docker-compose down -v 2>/dev/null || echo "   ℹ️  No containers to stop"

echo ""
echo "3️⃣ Starting PostgreSQL and App services..."
docker-compose up -d

echo ""
echo "4️⃣ Waiting for PostgreSQL to be ready..."
sleep 10

# Wait for PostgreSQL to be healthy
echo "   Checking PostgreSQL health..."
for i in {1..30}; do
    if docker exec calmkaaj_postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "   ✅ PostgreSQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ⚠️  PostgreSQL took longer than expected to start"
        echo "   Check logs: docker-compose logs postgres"
        exit 1
    fi
    echo "   Waiting... ($i/30)"
    sleep 2
done

echo ""
echo "5️⃣ Verifying database restoration..."
export $(cat .env | xargs)
node diagnose-db.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Open http://localhost:5000 in your browser"
echo "   2. Log in with your admin credentials"
echo "   3. Your data should now be visible!"
echo ""
echo "📊 To check logs:"
echo "   - App logs:      docker-compose logs app"
echo "   - Database logs: docker-compose logs postgres"
echo ""
