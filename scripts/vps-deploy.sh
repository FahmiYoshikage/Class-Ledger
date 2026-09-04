#!/bin/bash

# 🚀 Deploy Kas Kelas ke VPS
# Script untuk update dan rebuild containers

set -e

echo "=================================="
echo "🚀 Kas Kelas VPS Deployment"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Variables
PROJECT_PATH="/opt/telkom-cup"
DOMAIN="https://triforce.fahmi.app"

# Check if running on VPS
if [ ! -d "$PROJECT_PATH" ]; then
    echo -e "${RED}❌ Project tidak ditemukan di $PROJECT_PATH${NC}"
    echo "Jalankan setup dulu: ./scripts/vps-github-auth.sh"
    exit 1
fi

cd $PROJECT_PATH

# Step 1: Pull latest code
echo -e "${BLUE}📥 Pulling latest code from GitHub...${NC}"
git pull

echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Step 2: Check environment files
echo -e "${BLUE}🔍 Checking environment files...${NC}"

if [ ! -f "server/.env.production" ]; then
    echo -e "${YELLOW}⚠️  server/.env.production not found!${NC}"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 1
    fi
fi

if [ ! -f "client/.env.production" ]; then
    echo -e "${YELLOW}⚠️  client/.env.production not found!${NC}"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 1
    fi
fi

echo -e "${GREEN}✓ Environment files OK${NC}"
echo ""

# Step 3: Stop containers
echo -e "${BLUE}🛑 Stopping containers...${NC}"
docker-compose down

echo -e "${GREEN}✓ Containers stopped${NC}"
echo ""

# Step 4: Build and start containers
echo -e "${BLUE}🔨 Building and starting containers...${NC}"
docker-compose up -d --build

echo -e "${GREEN}✓ Containers started${NC}"
echo ""

# Step 5: Wait for containers to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Step 6: Check container status
echo ""
echo -e "${BLUE}📊 Container Status:${NC}"
docker-compose ps

echo ""
echo -e "${BLUE}🔍 Checking health...${NC}"

# Check backend health
BACKEND_HEALTH=$(docker exec kas-kelas-api curl -s http://localhost:5000/api/health || echo "FAIL")
if [ "$BACKEND_HEALTH" == "FAIL" ]; then
    echo -e "${YELLOW}⚠️  Backend health check failed${NC}"
else
    echo -e "${GREEN}✓ Backend: $BACKEND_HEALTH${NC}"
fi

# Check frontend
FRONTEND_CHECK=$(docker exec kas-kelas-frontend curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "000")
if [ "$FRONTEND_CHECK" == "200" ]; then
    echo -e "${GREEN}✓ Frontend: OK (HTTP $FRONTEND_CHECK)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend: HTTP $FRONTEND_CHECK${NC}"
fi

echo ""

# Step 7: Test Nginx routing
echo -e "${BLUE}🌐 Testing Nginx routing...${NC}"

NGINX_API=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8766/api/health || echo "000")
NGINX_FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8766 || echo "000")

if [ "$NGINX_API" == "200" ]; then
    echo -e "${GREEN}✓ Nginx → Backend API: OK${NC}"
else
    echo -e "${RED}✗ Nginx → Backend API: FAIL (HTTP $NGINX_API)${NC}"
fi

if [ "$NGINX_FRONTEND" == "200" ]; then
    echo -e "${GREEN}✓ Nginx → Frontend: OK${NC}"
else
    echo -e "${RED}✗ Nginx → Frontend: FAIL (HTTP $NGINX_FRONTEND)${NC}"
fi

echo ""

# Step 8: Show logs option
echo -e "${YELLOW}📋 View logs?${NC}"
echo "1) Backend logs"
echo "2) Frontend logs"
echo "3) Both"
echo "4) Skip"
read -p "Pilihan (1-4): " LOG_CHOICE

case $LOG_CHOICE in
    1)
        docker-compose logs -f api
        ;;
    2)
        docker-compose logs -f frontend
        ;;
    3)
        docker-compose logs -f
        ;;
    *)
        echo "Skipping logs..."
        ;;
esac

# Summary
echo ""
echo "=================================="
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo "=================================="
echo ""
echo "🌐 Application URLs:"
echo "  External: $DOMAIN"
echo "  API Health: $DOMAIN/api/health"
echo ""
echo "📊 Container Status:"
docker-compose ps
echo ""
echo "📝 Useful Commands:"
echo "  View logs: docker-compose logs -f"
echo "  Restart: docker-compose restart"
echo "  Stop: docker-compose down"
echo "  Shell: docker exec -it kas-kelas-api sh"
echo ""
echo -e "${YELLOW}⚠️  Note: DNS propagation may take a few minutes${NC}"
echo ""
