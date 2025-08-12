#!/bin/bash
# CalmKaaj Docker Build & Deploy Commands
# Run these commands on your local machine with Docker installed

echo "🐳 Building CalmKaaj Docker Image..."

# Build the Docker image
docker build -t calmkaaj/calmkaaj:latest .

echo "📦 Tagging image..."
# Create version tag
docker tag calmkaaj/calmkaaj:latest calmkaaj/calmkaaj:v1.0.0

echo "🧪 Testing container locally..."
# Test the container (replace with your actual environment variables)
docker run -d --name calmkaaj-test -p 5001:5000 \
  -e DATABASE_URL="postgresql://postgres:bjAHMjSFoAqNnMtjrIqRfcLMOGPUGMsK@yamanote.proxy.rlwy.net:53871/railway" \
  -e RESEND_API_KEY="your_resend_key" \
  -e SESSION_SECRET="your_session_secret" \
  calmkaaj/calmkaaj:latest

# Wait for container to start
sleep 10

echo "🏥 Testing health endpoint..."
curl http://localhost:5001/api/health

echo "📤 Ready to push to registry..."
echo "Run these commands to push:"
echo "docker login"
echo "docker push calmkaaj/calmkaaj:latest"
echo "docker push calmkaaj/calmkaaj:v1.0.0"

echo "🧹 Cleanup test container..."
docker stop calmkaaj-test
docker rm calmkaaj-test