#!/bin/bash

# 🔍 Quick Verification Script
# Check if deployment is working correctly

echo "=================================="
echo "🔍 Deployment Verification"
echo "=================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check containers
echo "📦 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep kas-kelas

echo ""
echo "🔍 Checking for trust proxy error in logs..."
TRUST_PROXY_ERROR=$(docker logs kas-kelas-api 2>&1 | grep -i "trust proxy" | grep -i "error")

if [ -z "$TRUST_PROXY_ERROR" ]; then
    echo -e "${GREEN}✅ No trust proxy error found!${NC}"
else
    echo -e "${RED}❌ Trust proxy error detected:${NC}"
    echo "$TRUST_PROXY_ERROR"
fi

echo ""
echo "🔍 Recent logs (last 20 lines):"
docker logs kas-kelas-api --tail 20

echo ""
echo "🌐 Testing endpoints..."

# Test backend health
BACKEND=$(curl -s http://localhost:5001/api/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend health: $BACKEND${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

# Test frontend
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8767)
if [ "$FRONTEND" == "200" ]; then
    echo -e "${GREEN}✅ Frontend: OK (HTTP $FRONTEND)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend: HTTP $FRONTEND${NC}"
fi

# Test Nginx routing
NGINX_API=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8766/api/health)
if [ "$NGINX_API" == "200" ]; then
    echo -e "${GREEN}✅ Nginx → Backend: OK${NC}"
else
    echo -e "${RED}❌ Nginx → Backend: FAIL (HTTP $NGINX_API)${NC}"
fi

NGINX_FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8766)
if [ "$NGINX_FRONTEND" == "200" ]; then
    echo -e "${GREEN}✅ Nginx → Frontend: OK${NC}"
else
    echo -e "${RED}❌ Nginx → Frontend: FAIL (HTTP $NGINX_FRONTEND)${NC}"
fi

echo ""
echo "🔔 Testing notification endpoint..."
REMINDERS=$(curl -s http://localhost:5001/api/notifications/needs-reminder?minWeeks=1 | head -c 100)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Notifications API: Working${NC}"
    echo "   Preview: $REMINDERS..."
else
    echo -e "${RED}❌ Notifications API: Failed${NC}"
fi

echo ""
echo "=================================="
echo "✅ Verification Complete"
echo "=================================="
