#!/bin/bash
# Production Deployment Script for Class Ledger
# Run this on the production server at /opt/Class-Ledger

echo "🚀 Starting deployment..."

# 1. Pull latest changes
echo "📥 Pulling latest code..."
git pull

# 2. Fix permissions for Docker volumes
echo "🔧 Fixing permissions..."
sudo chown -R 1001:1001 server/public/reports
sudo chown -R 1001:1001 server/uploads

# 3. Rebuild and restart containers
echo "🐳 Rebuilding containers..."
docker-compose down
docker-compose up -d --build

# 4. Wait for containers to start
echo "⏳ Waiting for containers to start..."
sleep 5

# 5. Check container status
echo "📊 Container status:"
docker ps | grep kas-kelas

# 6. Show recent logs
echo ""
echo "📋 Recent logs (API):"
docker logs --tail 20 kas-kelas-api

# 7. Health check
echo ""
echo "🏥 Testing API health..."
curl -s https://triforce.fahmi.app/api/health || echo "❌ Health check failed"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 To monitor logs:"
echo "   docker logs -f kas-kelas-api"
echo ""
echo "🧪 To test broadcast:"
echo "   curl -X POST https://triforce.fahmi.app/api/notifications/send-group-broadcast"
