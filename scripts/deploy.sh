#!/bin/bash

# 🔄 Kas Kelas - Deployment/Update Script
# Jalankan di VPS untuk deploy atau update aplikasi

set -e

echo "=================================="
echo "🔄 Kas Kelas Deployment Script"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/var/www/kas-kelas"
NGINX_DIR="/var/www/html/kas-kelas"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    echo "Please clone your repository first:"
    echo "  git clone <your-repo-url> $PROJECT_DIR"
    exit 1
fi

cd $PROJECT_DIR

# Pull latest code
echo "📥 Pulling latest code from git..."
git pull origin master || git pull origin main

# Backend deployment
echo ""
echo "🔧 Deploying backend..."
cd $PROJECT_DIR/server

# Install dependencies
echo "  📦 Installing backend dependencies..."
npm install --production

# Restart PM2
echo "  🔄 Restarting backend service..."
pm2 restart kas-kelas-api || pm2 start server.js --name kas-kelas-api

pm2 save

echo -e "${GREEN}✓ Backend deployed${NC}"

# Frontend deployment
echo ""
echo "🎨 Deploying frontend..."
cd $PROJECT_DIR/client

# Install dependencies
echo "  📦 Installing frontend dependencies..."
npm install

# Build
echo "  🏗️  Building frontend..."
npm run build

# Copy to nginx directory
echo "  📋 Copying files to nginx..."
sudo cp -r dist/* $NGINX_DIR/
sudo chown -R www-data:www-data $NGINX_DIR

echo -e "${GREEN}✓ Frontend deployed${NC}"

# Restart services
echo ""
echo "🔄 Restarting services..."
sudo systemctl restart nginx
pm2 restart kas-kelas-api

echo ""
echo "=================================="
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo "=================================="
echo ""
echo "📊 Service Status:"
pm2 list
echo ""
echo "🌐 Application URLs:"
echo "  Local: http://localhost:8012"
echo "  Public: https://kas-kelas.yourdomain.com"
echo ""
echo "📝 Check logs:"
echo "  PM2: pm2 logs kas-kelas-api"
echo "  Nginx: sudo tail -f /var/log/nginx/kas-kelas-access.log"
echo ""
